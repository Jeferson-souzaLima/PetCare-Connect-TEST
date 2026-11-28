/*
 * Espécies, raças e fases de vida aceitas no cadastro de pets. É a única lista:
 * o site busca em GET /pets/opcoes e a API só grava valores daqui.
 * Para incluir uma raça, basta acrescentá-la na espécie (o valor salvo é o nome exibido).
 */

const ESPECIES = [
    {
        nome: 'Cachorro',
        racas: [
            'Sem raça definida (vira-lata)', 'Akita', 'Basset Hound', 'Beagle', 'Bernese', 'Bichon Frisé',
            'Border Collie', 'Boston Terrier', 'Boxer', 'Buldogue Francês', 'Buldogue Inglês', 'Bull Terrier',
            'Cane Corso', 'Cavalier King Charles Spaniel', 'Chihuahua', 'Chow Chow', 'Cocker Spaniel',
            'Dachshund (Salsicha)', 'Dálmata', 'Dobermann', 'Dogo Argentino', 'Fila Brasileiro',
            'Fox Paulistinha', 'Golden Retriever', 'Husky Siberiano', 'Jack Russell Terrier',
            'Labrador Retriever', 'Lhasa Apso', 'Maltês', 'Mastim Napolitano', 'Pastor Alemão',
            'Pastor Australiano', 'Pastor Belga', 'Pequinês', 'Pinscher', 'Pit Bull', 'Poodle', 'Pug',
            'Rottweiler', 'Samoieda', 'Schnauzer', 'Shar-Pei', 'Shiba Inu', 'Shih Tzu',
            'Spitz Alemão (Lulu da Pomerânia)', 'Staffordshire Bull Terrier', 'Weimaraner',
            'West Highland White Terrier', 'Whippet', 'Yorkshire Terrier', 'Outra raça'
        ]
    },
    {
        nome: 'Gato',
        racas: [
            'Sem raça definida (vira-lata)', 'Abissínio', 'American Shorthair', 'Angorá', 'Azul Russo',
            'Bengal', 'Birmanês (Sagrado da Birmânia)', 'Bombaim', 'British Shorthair', 'Burmês',
            'Devon Rex', 'Exótico', 'Himalaio', 'Maine Coon', 'Munchkin', 'Persa', 'Ragdoll', 'Savannah',
            'Scottish Fold', 'Siamês', 'Siberiano', 'Sphynx', 'Outra raça'
        ]
    },
    {
        nome: 'Pássaro',
        racas: [
            'Agapornis', 'Cacatua', 'Calopsita', 'Canário', 'Diamante-de-gould', 'Mandarim', 'Papagaio',
            'Periquito-australiano', 'Ring-neck', 'Outra ave'
        ]
    },
    {
        nome: 'Peixe',
        racas: [
            'Acará-disco', 'Betta', 'Carpa', 'Guppy', 'Kinguio (peixe-dourado)', 'Molinésia', 'Neon',
            'Platy', 'Tetra', 'Outro peixe'
        ]
    },
    {
        nome: 'Roedor',
        racas: ['Chinchila', 'Gerbil', 'Hamster anão', 'Hamster sírio', 'Porquinho-da-índia', 'Rato twister', 'Outro roedor']
    },
    {
        nome: 'Coelho',
        racas: [
            'Sem raça definida', 'Angorá', 'Fuzzy Lop', 'Holland Lop', 'Lion Head', 'Mini Lop', 'Mini Rex',
            'Rex', 'Outra raça'
        ]
    },
    {
        nome: 'Réptil',
        racas: [
            'Cobra-do-milho', 'Dragão-barbudo', 'Gecko-leopardo', 'Iguana', 'Jabuti', 'Píton-bola',
            "Tartaruga tigre-d'água", 'Outro réptil'
        ]
    },
    { nome: 'Outro', racas: ['Outro'] }
];

/** Fases de vida: o id é o valor gravado (coluna pets.fase_vida). */
const FASES_VIDA = [
    { id: 'filhote', rotulo: 'Filhote', descricao: 'Até 1 ano' },
    { id: 'adulto', rotulo: 'Adulto', descricao: 'De 1 a 7 anos' },
    { id: 'senior', rotulo: 'Sênior', descricao: 'A partir de 8 anos' }
];

// Compara sem diferenciar maiúsculas, acentos e espaços extras.
const chave = (texto) => String(texto ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().replace(/\s+/g, ' ').toLowerCase();

/** Espécie do catálogo correspondente ao texto (ou null). */
function encontrarEspecie(texto) {
    const alvo = chave(texto);
    return ESPECIES.find((especie) => chave(especie.nome) === alvo) || null;
}

/** Nome da raça como está no catálogo, se ela pertence à espécie (ou null). */
function encontrarRaca(especie, texto) {
    const alvo = chave(texto);
    return especie?.racas.find((raca) => chave(raca) === alvo) || null;
}

const faseVidaValida = (valor) => FASES_VIDA.some((fase) => fase.id === valor);

module.exports = { ESPECIES, FASES_VIDA, encontrarEspecie, encontrarRaca, faseVidaValida };
