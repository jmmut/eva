package uk.ac.ebi.variation.eva.server.ws.ga4gh;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.apache.commons.lang.StringUtils;
import org.opencb.biodata.ga4gh.GASearchVariantRequest;
import org.opencb.biodata.ga4gh.GASearchVariantsResponse;
import org.opencb.biodata.ga4gh.GAVariant;
import org.opencb.biodata.models.feature.Region;
import org.opencb.biodata.models.variant.Variant;
import org.opencb.biodata.models.variant.ga4gh.GAVariantFactory;
import org.opencb.datastore.core.QueryResult;
import org.opencb.opencga.lib.auth.IllegalOpenCGACredentialsException;
import org.opencb.opencga.storage.variant.VariantDBAdaptor;
import org.opencb.opencga.storage.variant.mongodb.VariantMongoDBAdaptor;
import uk.ac.ebi.variation.eva.server.ws.EvaWSServer;

/**
 *
 * @author Cristina Yenyxe Gonzalez Garcia <cyenyxe@ebi.ac.uk>
 */
@Path("/{version}/ga4gh/variants")
@Produces(MediaType.APPLICATION_JSON)
public class GA4GHVariantWSServer extends EvaWSServer {
    
    private VariantDBAdaptor variantMongoDbAdaptor;

    public GA4GHVariantWSServer() throws IllegalOpenCGACredentialsException {
        super();
    }

    public GA4GHVariantWSServer(@DefaultValue("") @PathParam("version")String version, @Context UriInfo uriInfo, @Context HttpServletRequest hsr) 
            throws IOException, IllegalOpenCGACredentialsException {
        super(version, uriInfo, hsr);
        variantMongoDbAdaptor = new VariantMongoDBAdaptor(credentials);
    }

    @GET
    @Path("/search")
    /**
     * "start" and "end" are 0-based, whereas all the position stored are 1-based
     * 
     * @see http://ga4gh.org/documentation/api/v0.5/ga4gh_api.html#/schema/org.ga4gh.GASearchVariantsRequest
     */
    public Response getVariantsByRegion(@QueryParam("referenceName") String chromosome,
                                        @QueryParam("start") int start,
                                        @QueryParam("end") int end,
//                                        @QueryParam("variantName") String id,
                                        @QueryParam("variantSetIds") String studies,
//                                        @QueryParam("callSetIds") String samples,
                                        @QueryParam("pageToken") String pageToken,
                                        @DefaultValue("10") @QueryParam("maxResults") int limit,
                                        @DefaultValue("false") @QueryParam("histogram") boolean histogram,
                                        @DefaultValue("-1") @QueryParam("histogram_interval") int interval) {
        if (studies != null && !studies.isEmpty()) {
            queryOptions.put("studies", Arrays.asList(studies.split(",")));
        }
        
        int idxCurrentPage = 0;
        if (pageToken != null && !pageToken.isEmpty() && StringUtils.isNumeric(pageToken)) {
            idxCurrentPage = Integer.parseInt(pageToken);
            queryOptions.put("skip", idxCurrentPage * limit);
        }
        queryOptions.put("limit", limit);
        
        // Create the provided region, whose size can't excede 1 million positions
        Region region = new Region(chromosome, start, end);
        int regionSize = region.getEnd()-region.getStart();
        
        if (histogram) {
            if (interval > 0) {
                queryOptions.put("interval", interval);
            }
            return createOkResponse(variantMongoDbAdaptor.getVariantsHistogramByRegion(region, queryOptions));
        } else if (regionSize <= 1000000) {
            QueryResult<Variant> qr = variantMongoDbAdaptor.getAllVariantsByRegion(region, queryOptions);
            // Convert Variant objects to GAVariant
            List<GAVariant> gaVariants = GAVariantFactory.create(qr.getResult());
            // Calculate the next page token
            int idxLastElement = idxCurrentPage * limit + limit;
            String nextPageToken = (idxLastElement < qr.getNumTotalResults()) ? String.valueOf(idxCurrentPage + 1) : null;
            
            // Create the custom response for the GA4GH API
            return createJsonResponse(new GASearchVariantsResponse(gaVariants, nextPageToken));
        } else {
            return createErrorResponse("The total size of all regions provided can't exceed 1 million positions. "
                    + "If you want to browse a larger number of positions, please provide the parameter 'histogram=true'");
        }
        
    }
    
    @POST
    @Path("/search")
    @Consumes("application/x-www-form-urlencoded")
    /**
     * "start" and "end" are 0-based, whereas all the position stored are 1-based
     * 
     * @see http://ga4gh.org/documentation/api/v0.5/ga4gh_api.html#/schema/org.ga4gh.GASearchVariantsRequest
     */
    public Response getVariantsByRegion(@FormParam("request") String jsonRequest,
                                        @DefaultValue("false") @QueryParam("histogram") boolean histogram,
                                        @DefaultValue("-1") @QueryParam("histogram_interval") int interval) {
        ObjectMapper requestMapper = new ObjectMapper();
        ObjectReader requestReader = requestMapper.reader(GASearchVariantRequest.class);
        
        try {
            GASearchVariantRequest request = requestReader.readValue(jsonRequest);
            request.validate();
            return getVariantsByRegion(request.getReferenceName(), (int) request.getStart(), (int) request.getEnd(), 
                    StringUtils.join(request.getVariantSetIds(), ","), request.getPageToken(), request.getMaxResults(), 
                    histogram, interval);
        } catch (IllegalArgumentException | IOException ex) {
            return createErrorResponse(ex.getMessage());
        }
    }
}