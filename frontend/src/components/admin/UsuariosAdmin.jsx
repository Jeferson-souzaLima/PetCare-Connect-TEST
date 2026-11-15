import { useCallback, useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { listarUsuariosAdmin } from "@/services/adminService";
import { formatarDataHora } from "@/utils/formatadores";
import { mensagemDeErro } from "./mensagemDeErro";

const TIPOS = [
  { valor: "", rotulo: "Todos" },
  { valor: "cliente", rotulo: "Clientes" },
  { valor: "lojista", rotulo: "Lojistas" },
  { valor: "admin", rotulo: "Administradores" },
];

export default function UsuariosAdmin() {
  const [tipo, setTipo] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setMensagem(null);
    try {
      setUsuarios(await listarUsuariosAdmin({ tipo, busca: buscaAplicada }));
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar os usuários.") });
    } finally {
      setCarregando(false);
    }
  }, [tipo, buscaAplicada]);

  useEffect(() => { carregar(); }, [carregar]);

  function buscar(e) {
    e.preventDefault();
    setBuscaAplicada(busca.trim());
  }

  return (
    <section className="space-y-4">
      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm">
          {TIPOS.map(({ valor, rotulo }) => <option key={valor} value={valor}>{rotulo}</option>)}
        </select>
        <input
          type="search"
          value={busca}
          maxLength={100}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">Buscar</button>
      </form>

      <MensagemStatus mensagem={mensagem} />
      {carregando && <p className="text-gray-600">Carregando usuários...</p>}
      {!carregando && usuarios.length === 0 && <p className="text-gray-600">Nenhum usuário encontrado.</p>}

      {usuarios.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">E-mail confirmado</th>
                <th className="px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t">
                  <td className="px-4 py-3">{usuario.nome}</td>
                  <td className="px-4 py-3">{usuario.email}</td>
                  <td className="px-4 py-3 capitalize">{usuario.tipo}</td>
                  <td className="px-4 py-3">{usuario.email_verificado ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">{formatarDataHora(usuario.data_criacao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
