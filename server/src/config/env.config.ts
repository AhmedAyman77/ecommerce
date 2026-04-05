import dotenv from 'dotenv';

dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 5000),
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    
    SQL_TYPE: process.env.SQL_TYPE || 'sqlite',
    
    SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || "./database.sqlite",
    SQLITE_CONNECTION_STRING: process.env.SQLITE_CONNECTION_STRING,
    
    SQLSERVER_HOST: process.env.SQLSERVER_HOST,
    SQLSERVER_DATABASE: process.env.SQLSERVER_DATABASE,
    SQLSERVER_USER: process.env.SQLSERVER_USER,
    SQLSERVER_PASSWORD: process.env.SQLSERVER_PASSWORD,
    SQLSERVER_ENCRYPT: process.env.SQLSERVER_ENCRYPT || "true",
    SQLSERVER_TRUST_CERT: process.env.SQLSERVER_TRUST_CERT || "true",
    
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    STRIPE_SECRET: process.env.STRIPE_SECRET,
    
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379),


    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
    ELASTICSEARCH_railWay_URL: process.env.ELASTICSEARCH_railWay_URL,
    ELASTICSEARCH_API_KEY: process.env.ELASTICSEARCH_API_KEY,
    
    ARCJET_KEY: process.env.ARCJET_KEY,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};
