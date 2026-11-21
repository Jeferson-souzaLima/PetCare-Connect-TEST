import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { buscarMinhaLoja } from "@/services/lojaService";
import { obterPainelLojista } from "@/services/painelLojistaService";
import { CabecalhoLojista } from "@/components/lojista/CabecalhoLojista";
import { MenuLateralLojista } from "@/components/lojista/MenuLateralLojista";
import { BarraInferiorLojista } from "@/components/lojista/BarraInferiorLojista";
import { FaixaAdmin } from "@/components/navigation/FaixaAdmin";

/*
 * Moldura da área do lojista: cabeçalho, menu lateral (telas grandes) e barra
 * inferior (celular). Carrega a loja e o painel e repassa às páginas pelo
 * contexto do Outlet. O painel é recarregado a cada troca de página, para as
 * pendências do menu ficarem em dia.
 */
export default function LayoutLojista() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loja, setLoja] = useState(null);
  const [painel, setPainel] = useState({ estado: "carregando", dados: null });

  useEffect(() => {
    let ativo = true;
    buscarMinhaLoja(token)
      .then((dados) => { if (ativo) setLoja(dados); })
      .catch((erro) => console.error("Erro ao carregar a loja:", erro?.response?.status ?? erro?.message));
    return () => { ativo = false; };
  }, [token]);

  useEffect(() => {
    let ativo = true;
    obterPainelLojista()
      .then((dados) => { if (ativo) setPainel({ estado: "pronto", dados }); })
      .catch((erro) => {
        console.error("Erro ao carregar o painel:", erro?.response?.status ?? erro?.message);
        if (ativo) setPainel((atual) => (atual.dados ? atual : { estado: "erro", dados: null }));
      });
    return () => { ativo = false; };
  }, [pathname]);

  const sair = useCallback(() => {
    if (!window.confirm("Tem certeza que deseja sair da sua conta?")) return;
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const pendencias = painel.dados?.pendencias;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <FaixaAdmin />
      <CabecalhoLojista loja={loja} pendencias={pendencias} aoSair={sair} />
      <div className="mx-auto flex max-w-[1600px]">
        <MenuLateralLojista pendencias={pendencias} />
        <main className="min-w-0 flex-1 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-4 lg:px-6 lg:pb-10 lg:pt-6">
          <Outlet context={{ loja, painel }} />
        </main>
      </div>
      <BarraInferiorLojista pendencias={pendencias} aoSair={sair} />
    </div>
  );
}
