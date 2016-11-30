/*
 * European Variation Archive (EVA) - Open-access database of all types of genetic
 * variation data from all species
 *
 * Copyright 2016 EMBL - European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package uk.ac.ebi.eva.server.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.MongoDbFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import uk.ac.ebi.eva.commons.models.metadata.VariantEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Concrete implementation of the VariantEntityRepository interface (relationship inferred by Spring),
 * due to a custom DBObject to VariantEntity conversion
 *
 * <p>It also implements the VariantEntityRepositoryCustom interface,
 * to provide an explicit implementation of the region query, using a margin for efficiency.
 */
public class VariantEntityRepositoryImpl implements VariantEntityRepositoryCustom {

    private MongoDbFactory mongoDbFactory;
    private MongoTemplate mongoTemplate;
    private MappingMongoConverter mappingMongoConverter;

    private final int MARGIN = 1000000;

    @Autowired
    public VariantEntityRepositoryImpl(MongoDbFactory mongoDbFactory, MappingMongoConverter mappingMongoConverter) {
        this.mongoDbFactory = mongoDbFactory;
        this.mappingMongoConverter = mappingMongoConverter;
        mongoTemplate = new MongoTemplate(mongoDbFactory, mappingMongoConverter);
    }

    public List<VariantEntity> findByChrAndStartWithMarginAndEndWithMargin(String chr, int start, int end) {
        Query query = new Query(Criteria
                                        .where("chr").is(chr)
                                        .and("start").lte(end).gt(start - MARGIN)
                                        .and("end").gte(start).lt(end + MARGIN)
        );

        ArrayList<String> sortProps = new ArrayList<String>();
        sortProps.add("chr");
        sortProps.add("start");
        query.with(new Sort(Sort.Direction.ASC, sortProps));

        return mongoTemplate.find(query, VariantEntity.class);
    }

    private List<Integer> convertConsequenceType(List<String> consequenceType) {
        return consequenceType.stream().map(c -> Integer.parseInt(c, 10)).collect(Collectors.toList());
    }

    public List<VariantEntity> findByChrAndStartWithMarginAndEndWithMargin(String chr, int start, int end,
                                                                           List<String> consequenceType, String maf,
                                                                           String polyphenScore, List<String> studies) {

        Query query = new Query(Criteria
                                        .where("chr").is(chr)
                                        .and("start").lte(end).gt(start - MARGIN)
                                        .and("end").gte(start).lt(end + MARGIN)
        );

        if (consequenceType != null && !consequenceType.isEmpty()) {
            List<Integer> consequenceTypeConv = convertConsequenceType(consequenceType);
            query.addCriteria(Criteria.where("annot.ct.so").in(consequenceTypeConv));
        }

        ArrayList<String> sortProps = new ArrayList<String>();
        sortProps.add("chr");
        sortProps.add("start");
        query.with(new Sort(Sort.Direction.ASC, sortProps));

        return mongoTemplate.find(query, VariantEntity.class);

    }
}
