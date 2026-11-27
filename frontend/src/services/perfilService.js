import { api } from "./api";

/** Envia a nova foto de perfil (arquivo já preparado) e devolve a URL salva. */
export async function enviarFotoPerfil(arquivo) {
  const formulario = new FormData();
  formulario.append("foto", arquivo);
  const { data } = await api.put("/usuarios/me/foto", formulario);
  return data.foto;
}

/** Remove a foto de perfil (o site volta a mostrar as iniciais). */
export async function removerFotoPerfil() {
  await api.delete("/usuarios/me/foto");
}
