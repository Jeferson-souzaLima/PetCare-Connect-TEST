# Imagens faltantes: prompts de geração

Levantamento feito no banco de produção em 21/11/2026:

- 18 produtos estão sem nenhuma imagem.
- 3 lojas estão sem logo.

Os serviços não têm foto própria no banco: a plataforma mostra uma ilustração conforme o tipo do serviço. Banho, tosa, vacina, veterinário e passeio já têm ilustração. Veja a seção 4.

## 1. Regras para todas as imagens

| | Produtos | Logos de loja |
|---|---|---|
| Formato | **JPG** (ou PNG) | **PNG** (ou JPG) |
| Tamanho | 1200 × 1200 px (quadrado) | 800 × 800 px (quadrado) |
| Peso máximo | 5 MB | 5 MB |
| Fundo | branco liso, produto centralizado | branco ou cor sólida, logo centralizado com margem |

O sistema aceita só JPG e PNG de até 5 MB. **WEBP é recusado no upload.**

**Marcas reais.** Vários produtos têm nome de marca registrada, como "Premier Pet" e "Golden". Por isso os prompts pedem **embalagem genérica, sem marca e sem texto**. Imagens de IA imitando a embalagem de uma marca real podem gerar problema de propriedade de marca. Quando a loja for real, o ideal é usar a foto oficial do fabricante.

**Estilo base**, para colar no começo de cada prompt e deixar o catálogo com a mesma cara:

```
Professional e-commerce product photo, single product centered on a pure white background, soft studio lighting, subtle natural shadow under the product, sharp focus, high detail, square 1:1 composition, generous empty margin around the product, no text, no logos, no brand names, no watermark, no people.
```

Nome sugerido para o arquivo: `produto-<id>.jpg`. Exemplo: `produto-31.jpg`.

---

## 2. Produtos (18)

### Loja 6: Pet Shop do João

| ID | Produto | Prompt (depois do estilo base) |
|---|---|---|
| 31 | Ração Premier Pet Adultos | `A large stand-up bag of premium dry dog food for adult medium-size dogs, matte packaging in deep green and white, a small window showing brown kibble, a few kibble pieces scattered in front of the bag.` |
| 32 | Ração Golden Special Cães Adultos | `A large stand-up bag of dry dog food for adult dogs, glossy packaging in warm golden yellow and orange tones with an illustration of a happy adult dog, a small bowl of kibble beside it.` |
| 33 | Petisco Bifinho para Cães | `A resealable pouch of beef-flavored chewy dog treat sticks, red and brown packaging, several reddish meat stick treats arranged in front of the pouch.` |
| 34 | Brinquedo Bola Maciça | `A solid heavy-duty rubber ball dog toy, bright orange, textured surface, slightly angled to show its weight and durability.` |
| 35 | Shampoo Neutro para Pets | `A 500 ml white plastic bottle of neutral pet shampoo with a light blue flip cap, clean minimal label with soft paw print pattern, a few soap bubbles at the base.` |
| 36 | Comedouro Plástico Médio | `A medium-size round plastic pet food bowl in teal blue, wide non-slip rim, shown at a three-quarter angle, filled halfway with dry kibble.` |

### Loja 8: Jeffito Pet

| ID | Produto | Prompt (depois do estilo base) |
|---|---|---|
| 37 | Ração Premier Pet Filhotes | `A stand-up bag of dry puppy food, packaging in light blue and white with an illustration of a cute puppy, small-size kibble visible through a window, a few small kibble pieces in front.` |
| 38 | Ração Golden Gatos Adultos | `A stand-up bag of dry cat food for adult cats, packaging in purple and golden tones with an illustration of a calm adult cat, small fish-shaped kibble scattered in front.` |
| 39 | Areia Higiênica para Gatos | `A 4 kg bag of cat litter, light beige and lavender packaging with a cat silhouette, a small pile of white clumping litter granules beside the bag.` |
| 40 | Brinquedo Mordedor para Cães | `A durable dog chew toy shaped like a bone, made of textured nylon in bright green, with ridges and nubs for dental cleaning.` |
| 41 | Cama Pet Pequena | `A small round plush pet bed in soft grey with a raised cushioned rim and a removable beige inner cushion, cozy look, three-quarter angle.` |
| 42 | Coleira para Cães | `An adjustable nylon dog collar in red with a black plastic quick-release buckle and a silver metal D-ring, laid in a gentle curve.` |

### Loja 9: Pet Shop Central

| ID | Produto | Prompt (depois do estilo base) |
|---|---|---|
| 43 | Ração Premier Pet Raças Pequenas | `A medium stand-up bag of dry dog food for small breed adult dogs, packaging in coral and white with an illustration of a small dog, tiny kibble pieces in front of the bag.` |
| 44 | Ração Golden Special Gatos | `A stand-up bag of dry cat food, packaging in warm orange and cream tones with an illustration of a cat, a small ceramic bowl with kibble beside it.` |
| 45 | Petisco Natural para Cães | `A kraft paper resealable pouch of natural dog treats, earthy design with leaf motifs, dehydrated meat and sweet potato treat pieces arranged in front.` |
| 46 | Brinquedo Pelúcia para Pets | `A soft plush pet toy shaped like a cute brown teddy bear with stitched details, squeaky toy style, sitting upright.` |
| 47 | Tapete Higiênico para Cães | `A package of disposable dog training pads, light blue packaging, one white absorbent pad unfolded in front showing its quilted texture and blue border.` |
| 48 | Pote para Ração 2 Litros | `A 2-liter transparent plastic airtight pet food storage container with a white snap-lock lid, half filled with dry kibble, a small scoop beside it.` |

---

## 3. Logos das lojas (3)

O logo aparece pequeno e inteiro, sem corte: em círculos, cartões e no topo da página da loja. Por isso o desenho precisa ser simples e legível em tamanho pequeno.

**Estilo base dos logos:**

```
Flat vector logo for a pet shop, simple and modern, centered on a plain white background, square 1:1, clean geometric shapes, maximum two or three colors, readable at small sizes, no gradients, no mockup, no extra text besides the store name.
```

| Loja (ID) | Prompt (depois do estilo base) |
|---|---|
| Pet Shop Central (9) | `Store name "Pet Shop Central". Icon of a dog and a cat silhouette inside a circle with a small paw print, colors deep green and lime green.` |
| Aty Teste Loja (13) | `Store name "Aty Pet". Icon of a stylized paw print forming a heart, colors navy blue and warm orange.` |
| ATY TESTE (14) | `Store name "ATY". Minimal monogram of the letters ATY with a small dog ear shape on the letter A, colors teal and white.` |

Geradores de imagem costumam errar letras. Se o nome sair torto, gere **só o ícone**, removendo a parte `Store name ...`, e coloque o nome num editor como o Canva.

As lojas 13 e 14 são de teste. Os nomes "Aty Pet" e "ATY" nos prompts são sugestões; troque se as lojas mudarem de nome.

---

## 4. Serviços: nada a gerar agora

Os serviços usam ilustrações que já existem, escolhidas pelo nome do serviço:

| Tipo | Palavras no nome | Situação |
|---|---|---|
| Banho | banho, hidratação, escova | ✅ existe |
| Tosa | tosa | ✅ existe |
| Vacina | vacina | ✅ existe |
| Veterinário | veterinário, consulta, microchip, exame, castração, vermífugo | ✅ existe |
| Passeio | passeio, caminhada, dog walker | ✅ existe |

Dois serviços ficam sem ilustração por causa do nome:

- **"Microshipagem" (ID 8, loja 10):** o nome está com erro de digitação. Corrigindo para **"Microchipagem"** no painel da loja, ele passa a usar a ilustração de veterinário.
- **"Serviço de Teste" (ID 11, loja 10):** é um serviço de teste. O melhor é desativar ou apagar esse serviço.

---

## 5. Como subir as imagens

**Produtos:** o caminho mais seguro é pelo painel de cada loja. Entre com o login do lojista, abra **Produtos**, clique no lápis do produto, envie a imagem e marque-a como principal. O sistema já grava no armazenamento de imagens e no banco, com as checagens de segurança.

**Logos:** pelo login do lojista, em **Configurações**, na parte **Imagem da loja**.

Se não tiver acesso a algum login de loja, me mande as imagens já nomeadas (`produto-<id>.jpg` e `loja-<id>.png`). Eu preparo um script de envio para você rodar.
