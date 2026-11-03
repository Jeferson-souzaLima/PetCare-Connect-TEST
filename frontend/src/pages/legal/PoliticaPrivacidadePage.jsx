import { DocumentoLegal } from "@/components/legal/DocumentoLegal";
import { CONTROLADOR, EMAIL_PRIVACIDADE, VERSAO_PRIVACIDADE } from "@/constants/documentosLegais";

export default function PoliticaPrivacidadePage() {
  return (
    <DocumentoLegal titulo="Política de Privacidade" versao={VERSAO_PRIVACIDADE}>
      <p>
        Esta política explica quais dados pessoais o PetCare Connect trata, para quê, com quem eles são
        compartilhados e como você pode exercer seus direitos, conforme a Lei Geral de Proteção de Dados
        (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Quem é o responsável pelos seus dados</h2>
      <p>
        O controlador dos dados é {CONTROLADOR}. Para qualquer assunto sobre seus dados pessoais, escreva
        para {EMAIL_PRIVACIDADE}.
      </p>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome, e-mail, telefone e senha. A senha é guardada de forma cifrada (hash) e ninguém da equipe consegue lê-la.</li>
        <li><strong>Endereço:</strong> CEP, rua, número, complemento, bairro, cidade e UF, e as coordenadas geográficas calculadas a partir dele, usadas para entrega e cálculo de frete.</li>
        <li><strong>Localização do aparelho:</strong> só quando você autoriza no navegador. É usada para mostrar lojas e serviços próximos e para calcular a entrega. Se você escolher usar a localização atual para definir o endereço do seu perfil, as coordenadas ficam gravadas no seu cadastro.</li>
        <li><strong>Pets:</strong> nome, espécie, raça, idade e foto que você cadastrar.</li>
        <li><strong>Uso da plataforma:</strong> pedidos, agendamentos, favoritos e histórico de buscas (este último fica só no seu navegador).</li>
        <li><strong>Pagamentos:</strong> valor e situação do pagamento. Os dados do cartão ou do Pix são informados diretamente no Mercado Pago; o PetCare Connect não recebe nem guarda esses dados.</li>
        <li><strong>Lojistas:</strong> nome fantasia, razão social, CNPJ, telefone, endereço e descrição da loja, além das imagens publicadas.</li>
        <li><strong>Clientes atendidos fora da plataforma:</strong> quando a loja registra um agendamento manual, ela informa o nome e o telefone do cliente e o nome do pet. A loja é responsável por ter o direito de usar esses dados.</li>
        <li><strong>Dados técnicos:</strong> endereço IP, usado temporariamente para segurança (por exemplo, para limitar tentativas de login).</li>
      </ul>

      <h2>3. Para que usamos e com base em quê</h2>
      <ul>
        <li><strong>Criar e manter sua conta, processar pedidos, agendamentos, entregas e pagamentos:</strong> execução do contrato com você (art. 7º, V, da LGPD).</li>
        <li><strong>Enviar e-mails necessários ao serviço</strong>, como a confirmação de cadastro: execução do contrato.</li>
        <li><strong>Segurança e prevenção de fraudes e abusos:</strong> legítimo interesse (art. 7º, IX).</li>
        <li><strong>Cumprir obrigações legais e regulatórias:</strong> obrigação legal (art. 7º, II). [DEFINIR com o jurídico, incluindo a guarda de registros de acesso do Marco Civil da Internet, que ainda não está implementada.]</li>
        <li><strong>Usar a localização do aparelho:</strong> sua autorização no navegador, que pode ser retirada a qualquer momento nas configurações dele. Ao alterar o endereço do perfil, as coordenadas gravadas são substituídas pelas do novo endereço; para excluí-las, use os direitos do item 7.</li>
      </ul>
      <p>Não vendemos seus dados pessoais.</p>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li><strong>A loja que você escolher:</strong> recebe os dados necessários para atender seu pedido ou agendamento (nome, contato, endereço de entrega e dados do pet, quando for o caso).</li>
        <li><strong>Mercado Pago:</strong> processa os pagamentos.</li>
        <li><strong>Provedores de infraestrutura</strong> que hospedam e operam a plataforma: Vercel (site), Render (servidor), Aiven (banco de dados), Cloudflare (rede e armazenamento de imagens) e o provedor de envio de e-mails [A DEFINIR].</li>
        <li><strong>OpenStreetMap (Nominatim) e ViaCEP:</strong> recebem o endereço ou o CEP informado para encontrar as coordenadas e completar o endereço.</li>
        <li><strong>Google Fonts:</strong> fornece as fontes do site; ao carregar a página, seu navegador se conecta ao Google, que recebe seu endereço IP.</li>
        <li><strong>Autoridades públicas</strong>, quando houver obrigação legal ou ordem judicial.</li>
      </ul>

      <h2>5. Transferência para outros países</h2>
      <p>
        Alguns desses provedores podem armazenar ou processar dados fora do Brasil. Nesses casos, a
        transferência segue o art. 33 da LGPD e as regras da ANPD. [CONFIRMAR as regiões dos servidores e
        as garantias contratuais de cada provedor.]
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Guardamos os dados enquanto sua conta estiver ativa e, depois disso, pelo tempo exigido por lei ou
        necessário para o exercício de direitos (por exemplo, registros de pedidos e pagamentos).
        [DEFINIR os prazos de cada tipo de dado com o jurídico.]
      </p>

      <h2>7. Seus direitos</h2>
      <p>Você pode, a qualquer momento, pedir:</p>
      <ul>
        <li>confirmação de que tratamos seus dados e acesso a eles;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a LGPD;</li>
        <li>portabilidade dos dados;</li>
        <li>eliminação dos dados tratados com base no seu consentimento, e revogação desse consentimento;</li>
        <li>informação sobre com quem compartilhamos seus dados;</li>
        <li>revisão de decisões tomadas apenas com base em tratamento automatizado.</li>
      </ul>
      <p>
        Para exercer esses direitos, escreva para {EMAIL_PRIVACIDADE}. Você também pode apresentar
        reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Segurança</h2>
      <p>
        Usamos medidas técnicas e administrativas para proteger seus dados, como conexão cifrada (HTTPS),
        senhas guardadas com hash, controle de acesso por perfil e limite de tentativas de login. Nenhum
        sistema é totalmente imune a falhas; se ocorrer um incidente de segurança que possa causar risco ou
        dano relevante, você e a ANPD serão comunicados, conforme a lei.
      </p>

      <h2>9. Armazenamento no navegador</h2>
      <p>
        Para manter você conectado, o site guarda no seu navegador (armazenamento local) a sessão de login e
        dados básicos do seu perfil, além do histórico de buscas. Ao sair da conta, a sessão é apagada. Não
        usamos cookies de publicidade.
      </p>

      <h2>10. Menores de idade</h2>
      <p>O cadastro é destinado a maiores de 18 anos. [CONFIRMAR com o jurídico.]</p>

      <h2>11. Alterações desta política</h2>
      <p>
        Quando esta política mudar, a nova versão será publicada nesta página com a data de atualização.
        Mudanças relevantes serão avisadas pelo site ou por e-mail.
      </p>
    </DocumentoLegal>
  );
}
