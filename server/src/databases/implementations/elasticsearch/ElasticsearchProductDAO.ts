import { esClient } from '../../../config/elasticsearch';
import { Product } from '../../../types/models.types';

export class ElasticsearchProductDAO {

    async index(product: Product): Promise<void> {
        await esClient.index({
            index: 'products',
            id: product._id,
            document: {
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                image: product.image,
                isFeatured: product.isFeatured,
                createdAt: product.createdAt,
            },
        });
    }

    async remove(productId: string): Promise<void> {
        await esClient.delete({
            index: 'products',
            id: productId,
        });
    }

    async search(query: string, category?: string): Promise<Product[]> {
        const must: any[] = [
            {
                multi_match: {
                    query,
                    fields: ['name^3', 'description', 'category'], // name weighted 3x
                    fuzziness: 'AUTO', // tolerates typos automatically
                },
            },
        ];

        // If category provided, filter by it
        const filter: any[] = category
            ? [{ term: { category } }]
            : [];

        const result = await esClient.search({
            index: 'products',
            query: {
                bool: { must, filter },
            },
        });

        return result.hits.hits.map((hit: any) => hit._source as Product);
    }

    // Sync entire DB into Elasticsearch (run once on startup)
    async bulkIndex(products: Product[]): Promise<void> {
        if (products.length === 0) return;

        const operations = products.flatMap((p) => [
            { index: { _index: 'products', _id: p._id } },
            {
                name: p.name,
                description: p.description,
                category: p.category,
                price: p.price,
                image: p.image,
                isFeatured: p.isFeatured,
                createdAt: p.createdAt,
            },
        ]);

        await esClient.bulk({ operations });
    }
}

export const esProductDAO = new ElasticsearchProductDAO();