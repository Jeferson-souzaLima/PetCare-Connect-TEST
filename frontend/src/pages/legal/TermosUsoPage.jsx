import { Link } from "react-router-dom";
import { DocumentoLegal } from "@/components/legal/DocumentoLegal";
import { CONTROLADOR, EMAIL_PRIVACIDADE, VERSAO_TERMOS } from "@/constants/documentosLegais";

export default function TermosUsoPage() {
  return (
    <DocumentoLegal titulo="Termos de Uso" versao={VERSAO_TERMOS}>
      <p>
        Estes termos regulam o uso do PetCare Connect, plataforma operada por {CONTROLADOR}. Ao criar uma
        conta, você declara que leu e aceita estas condições.
      </p>

      <h2>1. O que é o PetCare Connect</h2>
      <p>
        Uma plataforma que conecta tutores de animais a pet shops, clínicas veterinárias e outros
        prestadores de serviços para pets. Pela plataforma, o tutor encontra lojas, compra produtos e agenda
        serviços oferecidos por essas lojas.
      </p>
      <p>
        Os produtos e serviços são oferecidos e prestados pelas lojas cadastradas. [DEFINIR com o jurídico
        a responsabilidade da plataforma e das lojas perante o consumidor, considerando o Código de Defesa
        do Consumidor.]
      </p>

      <h2>2. Cadastro</h2>
      <ul>
        <li>O cadastro é pessoal e destinado a maiores de 18 anos.</li>
        <li>Você deve informar dados verdadeiros e mantê-los atualizados.</li>
        <li>Você é responsável por manter sua senha em sigilo e pelas ações feitas com sua conta.</li>
        <li>Se perceber uso indevido da sua conta, avise-nos imediatamente.</li>
      </ul>

      <h2>3. Pedidos, pagamentos e entregas</h2>
      <ul>
        <li>Preços, disponibilidade, prazo e taxa de entrega são definidos por cada loja e exibidos antes da confirmação.</li>
        <li>Os pagamentos são processados pelo Mercado Pago. O pedido só é confirmado após a aprovação do pagamento.</li>
        <li>[DEFINIR as regras de cancelamento, troca, devolução e reembolso, incluindo o direito de arrependimento em compras on-line.]</li>
      </ul>

      <h2>4. Agendamentos</h2>
      <ul>
        <li>O horário só fica garantido depois da confirmação do agendamento.</li>
        <li>[DEFINIR as regras de cancelamento, remarcação e não comparecimento.]</li>
      </ul>

      <h2>5. Regras para lojistas</h2>
      <ul>
        <li>A loja deve ter CNPJ ativo e informar dados corretos sobre a empresa, os produtos e os serviços.</li>
        <li>A loja é responsável pelos produtos que vende e pelos serviços que presta, e deve cumprir a legislação aplicável, inclusive a do consumidor e a sanitária.</li>
        <li>A loja só pode usar os dados dos clientes para atender os pedidos e agendamentos feitos pela plataforma.</li>
        <li>[DEFINIR comissões, tarifas e prazos de repasse, se houver.]</li>
      </ul>

      <h2>6. O que não é permitido</h2>
      <ul>
        <li>Usar a plataforma para fins ilegais ou fraudulentos.</li>
        <li>Tentar acessar contas, dados ou áreas restritas de outras pessoas.</li>
        <li>Publicar conteúdo falso, ofensivo ou que viole direitos de terceiros.</li>
        <li>Prejudicar o funcionamento da plataforma, por exemplo com acessos automatizados abusivos.</li>
      </ul>
      <p>O descumprimento destas regras pode levar à suspensão ou ao encerramento da conta.</p>

      <h2>7. Privacidade</h2>
      <p>
        O tratamento dos seus dados pessoais é descrito na <Link to="/privacidade" className="font-semibold text-green-900 underline">Política de Privacidade</Link>.
      </p>

      <h2>8. Alterações destes termos</h2>
      <p>
        Estes termos podem ser atualizados. A nova versão será publicada nesta página, e mudanças relevantes
        serão avisadas com antecedência.
      </p>

      <h2>9. Contato e foro</h2>
      <p>
        Dúvidas sobre estes termos: {EMAIL_PRIVACIDADE}. [DEFINIR o canal de atendimento geral e o foro
        com o jurídico.]
      </p>
    </DocumentoLegal>
  );
}
