import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ import thêm swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

// ================= Swagger Config =================
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IOT API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API cho hệ thống IoT',
    },
    servers: [
      {
        url: 'http://localhost:3000/api', // base url API
      },
    ],
  },
  apis: ['./src/routes/*.js'], // nơi chứa docs (comment trong routes)
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
// ==================================================

app.use('/api', routes);

export default app;
