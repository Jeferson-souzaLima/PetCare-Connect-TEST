// hooks/useAuth.js
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from "react";
import {
  EVENTO_SESSAO_EXPIRADA,
  deixarAvisoParaLogin,
  esperaAteConferirToken,
  tokenExpirado
} from "@/utils/sessao";

const AuthContext = createContext();

// Sessão do admin guardada enquanto ele gerencia uma loja (volta para ela depois).
const CHAVE_SESSAO_ADMIN = "sessao_admin";

function lerSessaoAdminGuardada() {
  try {
    const salva = JSON.parse(localStorage.getItem(CHAVE_SESSAO_ADMIN) || "null");
    if (salva?.usuario?.tipo === "admin" && salva.token && !tokenExpirado(salva.token)) return salva;
  } catch {
    console.warn("Sessão de administrador guardada inválida.");
  }
  localStorage.removeItem(CHAVE_SESSAO_ADMIN);
  return null;
}

/*
 * Lê a sessão salva de forma síncrona, antes da primeira renderização.
 * Assim o PrivateRoute já recebe o usuário em uma recarga (F5) ou link direto,
 * em vez de redirecionar para /login enquanto a sessão ainda não foi lida.
 * Dados corrompidos no localStorage ou token já expirado são tratados como
 * "sem sessão".
 */
function lerSessaoSalva() {
  try {
    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const usuario = JSON.parse(storedUser);

      if (usuario && typeof usuario === "object" && !tokenExpirado(storedToken)) {
        return { usuario, token: storedToken };
      }

      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
    }
  } catch {
    console.warn("Sessão salva inválida; é necessário entrar novamente.");
  }

  return { usuario: null, token: null };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => lerSessaoSalva().usuario);
  const [token, setToken] = useState(() => lerSessaoSalva().token);

  const login = (userData, jwtToken) => {
    setUsuario(userData);
    setToken(jwtToken);
    localStorage.setItem("usuario", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  const atualizarUsuario = useCallback((dadosAtualizados) => {
    setUsuario((usuarioAtual) => {
      const usuarioAtualizado = {
        ...usuarioAtual,
        ...dadosAtualizados
      };

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuarioAtualizado)
      );

      return usuarioAtualizado;
    });
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem(CHAVE_SESSAO_ADMIN);
  }, []);

  /** Admin passa a usar a área do lojista de uma loja (acesso de 2 horas emitido pela API). */
  const iniciarGerenciamento = useCallback((usuarioDaLoja, tokenDaLoja) => {
    localStorage.setItem(CHAVE_SESSAO_ADMIN, JSON.stringify({ usuario, token }));
    login(usuarioDaLoja, tokenDaLoja);
  }, [usuario, token]);

  /** Volta para a sessão do admin. Devolve false se ela já expirou (aí sai de tudo). */
  const encerrarGerenciamento = useCallback(() => {
    const sessaoAdmin = lerSessaoAdminGuardada();
    localStorage.removeItem(CHAVE_SESSAO_ADMIN);
    if (!sessaoAdmin) {
      logout();
      return false;
    }
    login(sessaoAdmin.usuario, sessaoAdmin.token);
    return true;
  }, [logout]);

  // Encerra a sessão quando o token vence ou a API o recusa (401),
  // em vez de manter a pessoa "logada" com chamadas falhando.
  const encerrarSessaoExpirada = useCallback(() => {
    // Fim do gerenciamento de uma loja: volta para o admin, se a sessão dele ainda vale.
    if (usuario?.gerenciado_por_admin && encerrarGerenciamento()) return;
    deixarAvisoParaLogin("Sua sessão expirou. Entre novamente para continuar.");
    logout();
  }, [logout, usuario, encerrarGerenciamento]);

  useEffect(() => {
    if (!token) return undefined;

    let timer;
    const agendar = () => {
      const espera = esperaAteConferirToken(token);
      if (espera === null) return;
      timer = setTimeout(() => (tokenExpirado(token) ? encerrarSessaoExpirada() : agendar()), espera);
    };

    agendar();
    return () => clearTimeout(timer);
  }, [token, encerrarSessaoExpirada]);

  useEffect(() => {
    if (!token) return undefined;

    window.addEventListener(EVENTO_SESSAO_EXPIRADA, encerrarSessaoExpirada);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, encerrarSessaoExpirada);
  }, [token, encerrarSessaoExpirada]);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        atualizarUsuario,
        iniciarGerenciamento,
        encerrarGerenciamento
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}