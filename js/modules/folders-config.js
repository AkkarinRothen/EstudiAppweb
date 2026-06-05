// Folders Configuration for Decks Page Explorer
export const FOLDERS_CONFIG = [
    {
        id: 'generales',
        title: 'Mazos Generales',
        desc: 'Colección completa de todos los mazos didácticos creados a partir de imágenes o PDFs.',
        parentId: null,
        color: 'blue',
        coverKeyword: 'study'
    },
    {
        id: 'tablas',
        title: 'Tablas Didácticas',
        desc: 'Vocabulario estructurado para generar flashcards y realizar repasos activos.',
        parentId: null,
        color: 'green',
        coverKeyword: 'spreadsheet'
    },
    {
        id: 'viajes',
        title: 'Viajes y Alojamiento',
        desc: 'Vocabulario esencial para viajar y hospedarse.',
        parentId: null,
        color: 'yellow',
        coverKeyword: 'travel'
    },
    {
        id: 'comida',
        title: 'Comida y Cocina',
        desc: 'Restaurantes, compras y técnicas culinarias.',
        parentId: null,
        color: 'pink',
        coverKeyword: 'food'
    },
    {
        id: 'vida_diaria',
        title: 'Vida Diaria y Ocio',
        desc: 'Rutinas, pasatiempos, salud y cotidianidad.',
        parentId: null,
        color: 'black',
        coverKeyword: 'lifestyle'
    },
    {
        id: 'vida_rutinas',
        title: 'Rutina Diaria',
        desc: 'Acciones desde la mañana hasta la noche.',
        parentId: 'vida_diaria',
        color: 'blue',
        coverKeyword: 'routine'
    },
    {
        id: 'personalizados',
        title: 'Mis Personalizados',
        desc: 'Tablas importadas desde CSV o archivos locales.',
        parentId: null,
        color: 'black',
        coverKeyword: 'files'
    }
];

/**
 * Returns the folder layout mappings of decks to their specific folder IDs.
 * A deck can belong to multiple folders (e.g. airport in general and viajes).
 */
export const DECK_FOLDER_MAPPINGS = {
    // Viajes
    'aeropuerto': ['viajes'],
    'direcciones': ['viajes'],
    'alojamiento': ['viajes'],
    
    // Comida
    'restaurante': ['comida'],
    'cocinando': ['comida'],
    'supermercado': ['comida'],
    
    // Vida Diaria
    'rutina_manana': ['vida_diaria', 'vida_rutinas'],
    'tarde_noche': ['vida_diaria', 'vida_rutinas'],
    'compras': ['vida_diaria'],
    'ocio': ['vida_diaria'],
    'salud': ['vida_diaria']
};

