/*
 * Copyright 2017 EMBL - European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package uk.ac.ebi.eva.lib;

import com.mongodb.MongoClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDbFactory;

import uk.ac.ebi.eva.lib.utils.DBAdaptorConnector;
import uk.ac.ebi.eva.lib.utils.MultiMongoDbFactory;

import java.io.IOException;
import java.util.Properties;

@Configuration
public class MultiMongoFactoryConfiguration {

    /**
     * Inject into the spring context a MultiMongoDbFactory as the implementation of MongoDbFactory.
     * This factory will allow to use the Repositories with several databases.
     */
    @Bean
    public MongoDbFactory mongoDbFactory() throws IOException {
        Properties properties = new Properties();
        properties.load(MongoConfiguration.class.getResourceAsStream("/eva.properties"));
        MongoClient mongoClient = DBAdaptorConnector.getMongoClient(properties);
        return new MultiMongoDbFactory(mongoClient, "unusedDefaultDB");
    }
}
