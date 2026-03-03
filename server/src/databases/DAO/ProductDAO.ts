import { BaseDAO } from "./BaseDAO";
import { Product } from "../../types/models.types";

export abstract class ProductDAO extends BaseDAO<Product> {
    abstract findByCategory(category: string): Promise<Product[]>;
    abstract findFeatured(): Promise<Product[]>;
    abstract toggleFeatured(id: string): Promise<Product | null>;
    abstract findRandom(count: number): Promise<Product[]>;
}