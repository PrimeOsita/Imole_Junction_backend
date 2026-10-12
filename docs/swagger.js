const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const swaggerFilePath = path.join(__dirname, 'swagger.yml');

const swaggerSpec = YAML.parse(
    fs.readFileSync(swaggerFilePath, 'utf8')
);

module.exports = { swaggerSpec };
