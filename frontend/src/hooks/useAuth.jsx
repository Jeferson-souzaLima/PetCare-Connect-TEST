// hooks/useAuth.js
import {
  createContext,
  useContext,
  useState,
  useCallback
} from "react";

const AuthContext = createContext();

/*
 * Lê a sessão salva de forma síncrona, antes da primeira renderização.
 * Assim o PrivateRoute já recebe o usuário em uma recarga (F5) ou link direto,
 * em vez de redirecionar para /login enquanto a sessão ainda não foi lida.
 * Dados corrompidos no localStorage são tratados como "sem sessão".
 */
function lerSessaoSalva() {
  try {
    const storedUser = localStorage.getItem("usuario");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const usuario = JSON.parse(storedUser);

      if (usuario && typeof usuario === "object") {
        return { usuario, token: storedToken };
      }
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

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        atualizarUsuario
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}