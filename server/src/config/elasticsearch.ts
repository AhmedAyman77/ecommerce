import { Client } from '@elastic/elasticsearch';
import { env } from './env.config';

export const esClient = new Client({
    node: env.ELASTICSEARCH_URL,
    ...(env.ELASTICSEARCH_API_KEY && {
        auth: { apiKey: env.ELASTICSEARCH_API_KEY },
    }),
});

export async function initElasticsearch(): Promise<void> {
    await esClient.ping();
    console.log('✅ Elasticsearch connected');

    // Create the products index if it doesn't exist
    const exists = await esClient.indices.exists({ index: 'products' });
    if (!exists) {
        await esClient.indices.create({
            index: 'products',
            mappings: {
                properties: {
                    name:        { type: 'text', analyzer: 'standard' },
                    description: { type: 'text', analyzer: 'standard' },
                    category:    { type: 'keyword' },
                    price:       { type: 'float' },
                    image:       { type: 'keyword', index: false },
                    isFeatured:  { type: 'boolean' },
                    createdAt:   { type: 'date' },
                },
            },
        });
        console.log('✅ Elasticsearch "products" index created');
    }
}