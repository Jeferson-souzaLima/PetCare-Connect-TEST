import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { AuthProvider } from './hooks/useAuth';
import { CarrinhoProvider } from './context/CarrinhoContext';
import { BuscaProvider } from "./context/BuscaContext";
import { LocalizacaoProvider } from "./context/LocalizacaoProvider";

function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <BuscaProvider>
          <LocalizacaoProvider>
            <RouterProvider router={router} />
          </LocalizacaoProvider>
        </BuscaProvider>
      </CarrinhoProvider>
    </AuthProvider>
  );
}

export default App;