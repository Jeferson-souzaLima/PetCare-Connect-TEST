import assert from "node:assert/strict";
import test from "node:test";
import { itemAtivo, rotuloContador, unidadesNoCarrinho } from "./navegacaoInferior.js";

test("itemAtivo: o destaque acompanha a página, e não fica preso em Início", () => {
  const casos = {
    "/": "inicio",
    "/produtos": "explorar",
    "/produtos/12": "explorar",
    "/servicos": "explorar",
    "/lojas/3": "explorar",
    "/busca": "explorar",
    "/agendar/3/7": "explorar",
    "/meus-agendamentos": "agenda",
    "/meus-pedidos": "pedidos",
    "/pagamento/sucesso": "pedidos",
    "/carrinho": "carrinho",
    "/perfil": "conta",
    "/favoritos": "conta",
    "/perfil/": "conta",
  };
  for (const [caminho, esperado] of Object.entries(casos)) {
    assert.equal(itemAtivo(caminho), esperado, caminho);
  }
});

test("itemAtivo: páginas fora da barra não destacam nada", () => {
  for (const caminho of ["/admin", "/login", "/produtosfalsos", "/termos"]) {
    assert.equal(itemAtivo(caminho), null, caminho);
  }
  assert.equal(itemAtivo(""), "inicio");
});

test("unidadesNoCarrinho e rotuloContador", () => {
  assert.equal(unidadesNoCarrinho(null), 0);
  assert.equal(unidadesNoCarrinho({ itens: [{ quantidade: 2 }, { quantidade: "3" }] }), 5);
  assert.equal(rotuloContador(7), "7");
  assert.equal(rotuloContador(120), "99+");
});
