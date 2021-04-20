import type { GenericJsonSchema } from './GenericJsonSchema';

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    $id: 'https://acme.com/gemaelde.json#',
    title: 'Gemaelde',
    description: 'Eigenschaften eines Gemaeldes: Typen und Einschraenkungen',
    type: 'object',
    properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        _id: {
            type: 'string',
            pattern:
                '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$',
        },
        __v: {
            type: 'number',
            minimum: 0,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
        titel: {
            type: 'string',
            pattern: '^\\w.*',
        },
        gemaeldeart: {
            type: 'string',
            enum: ['OELGEMAELDE', 'SIEBDRUCK', 'WASSERFARBENGEMAELDE'],
        },
        haendler: {
            type: 'string',
            enum: ['HAENDLER1', 'HAENDLER2', ''],
        },
        wert: {
            type: 'number',
            minimum: 0,
        },
        bewertung: {
            type: 'string',
            enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C'],
        },

        ausgestellt: { type: 'boolean' },
        // https://github.com/ajv-validator/ajv-formats
        datum: { type: 'string', format: 'date' },
        zertifizierung: {
            type: 'string',
            // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
            // TODO https://github.com/ajv-validator/ajv-formats/issues/14
            pattern:
                '^(?:ISGN(?:-1[03])?:? )?(?=[0-9X]{10}$|' +
                '(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|' +
                '(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?' +
                '[0-9]+[- ]?[0-9]+[- ]?[0-9X]*',
        },
        // https://github.com/ajv-validator/ajv-formats
        homepage: { type: 'string', format: 'uri' },
        kategorie: {
            type: 'array',
            items: { type: 'string' },
        },
        kuenstler: {
            type: 'array',
            items: { type: 'object' },
        },
    },
    // isgn ist NUR beim Neuanlegen ein Pflichtfeld
    // Mongoose bietet dazu die Funktion MyModel.findByIdAndUpdate()
    required: ['titel', 'gemaeldeart', 'haendler'],
    errorMessage: {
        properties: {
            titel:
                'Ein Gemaeldetitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            beschreibung:
                'Die Beschreibung muss vorhanden sein und darf maximal 99 Zeichen lang sein',
            art: 'Die Art eines Gemaelde muss KINDLE oder DRUCKAUSGABE sein.',
            verlag:
                'Der Haendler eines Gemaeldes muss ein OELGEMAELDE, SIEBDRUCK oder WASSERFARBENGEMAELDE sein.',
            wert: 'Der Wert darf nicht negativ sein.',
            ausgestellt: '"ausgestellt" muss auf true oder false gesetzt sein.',
            datum: 'Das Datum muss im Format yyyy-MM-dd sein.',
            zertifizierung: 'Die Zertifizierungsnummer ist nicht korrekt.',
        },
    },
    additionalProperties: false,
};
