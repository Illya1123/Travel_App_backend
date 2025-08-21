import swaggerAutogen from 'swagger-autogen'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.development' });

const doc = {
    info: {
        title: 'Travel App API Project',
        description: 'API documentation for Travel application',
    },
    host: `${process.env.URL_SWAGGER}:${process.env.PORT}`,
    schemes: ['http'],
    // securityDefinitions: {
    //     bearerAuth: {
    //         type: 'apiKey',
    //         name: 'Authorization',
    //         in: 'header',
    //         description: "Enter your token in the format: Bearer <token>",
    //     },
    // },
    // security: [
    //     {
    //         bearerAuth: [],
    //     },
    // ],
}

const outputFile = './swagger_output.json'
// endpointsFiles để trỏ trực tiếp tới file routes
const endpointsFiles = ['../../routes/index.js']

const options = {
    autoHeaders: true,
    autoQuery: true,
    autoBody: true,
    autoResponse: true,
}

const generateSwagger = async () => {
    await swaggerAutogen(options)(outputFile, endpointsFiles, doc)
    console.log('Swagger documentation generated successfully!')
}

generateSwagger().catch(console.error)
