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
        Os produtos e serviços são oferecidos e prestados pelas lojas cadastradas, que respondem por eles:
        preço, qualidade, entrega, garantia e informações. O PetCare Connect intermedeia a compra e o
        agendamento, processa o pagamento pelo Mercado Pago e recebe reclamações pelo canal de contato
        indicado no item 9, sem prejuízo dos direitos garantidos pelo Código de Defesa do Consumidor.
      </p>
      <p>
        Lojas só aparecem na plataforma depois que o cadastro é analisado e aprovado pela nossa equipe.
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
        <li>Os pagamentos são processados pelo Mercado Pago e o valor é recebido diretamente pela loja. O PetCare Connect não recebe o valor das compras.</li>
        <li>Depois de iniciar o pagamento, você tem 10 minutos para concluí-lo. Sem pagamento nesse prazo, o pedido é cancelado automaticamente e nada é cobrado.</li>
        <li>O pedido só é confirmado após a aprovação do pagamento.</li>
        <li>Você pode cancelar o pedido pelo próprio site, em "Meus pedidos", até a loja iniciar o preparo. Se o pedido já foi pago, o valor é devolvido integralmente, na mesma forma de pagamento.</li>
        <li>Depois que o preparo começou, e em até 7 dias a contar do recebimento do produto, você pode exercer o direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor pelo canal de contato do item 9. Nesse caso, o valor pago é devolvido integralmente.</li>
        <li>Produtos com defeito seguem as regras de troca, reparo e devolução do Código de Defesa do Consumidor, de responsabilidade da loja que fez a venda.</li>
        <li>Os reembolsos são feitos pelo Mercado Pago. O prazo para o valor aparecer na sua conta ou fatura depende do Mercado Pago e da instituição do seu meio de pagamento.</li>
      </ul>

      <h2>4. Agendamentos</h2>
      <ul>
        <li>Depois de escolher o horário, você tem 30 minutos para concluir o pagamento. Sem pagamento nesse prazo, o agendamento é cancelado e o horário liberado.</li>
        <li>O horário só fica garantido depois da confirmação do pagamento.</li>
        <li>Você pode cancelar o agendamento pelo site, em "Meus agendamentos", até o horário marcado. Se ele já foi pago, o valor é devolvido integralmente.</li>
        <li>Para remarcar, cancele o agendamento e escolha um novo horário.</li>
        <li>Se a loja cancelar o agendamento, o valor pago é devolvido integralmente.</li>
        <li>Não há cobrança de taxa por cancelamento ou por não comparecimento.</li>
      </ul>

      <h2>5. Regras para lojistas</h2>
      <ul>
        <li>A loja deve ter CNPJ ativo e informar dados corretos sobre a empresa, os produtos e os serviços.</li>
        <li>A loja é responsável pelos produtos que vende e pelos serviços que presta, e deve cumprir a legislação aplicável, inclusive a do consumidor e a sanitária.</li>
        <li>A loja só pode usar os dados dos clientes para atender os pedidos e agendamentos feitos pela plataforma.</li>
        <li>A loja só aparece para os clientes depois que o cadastro é aprovado pela nossa equipe. A loja pode ser suspensa se descumprir estes termos.</li>
        <li>Para receber pagamentos pela plataforma, a loja precisa conectar uma conta própria do Mercado Pago. Ao conectar, a loja autoriza o PetCare Connect a criar cobranças em seu nome e a descontar a comissão em cada venda.</li>
        <li>O PetCare Connect cobra comissão de 8% sobre o valor dos produtos (sem o frete) e de 10% sobre o valor dos serviços, descontada automaticamente no momento do pagamento.</li>
        <li>A tarifa do Mercado Pago é cobrada na conta da loja, conforme as condições contratadas por ela com o Mercado Pago. O prazo para o dinheiro ficar disponível também segue essas condições.</li>
        <li>Quando uma venda é cancelada com reembolso, o valor total é devolvido ao cliente, incluindo a comissão do PetCare Connect.</li>
        <li>A loja pode desconectar a conta Mercado Pago a qualquer momento. Sem uma conta conectada, ela não recebe pedidos nem agendamentos com pagamento on-line.</li>
        <li>Mudanças nos percentuais de comissão serão avisadas com pelo menos 30 dias de antecedência.</li>
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
        Atendimento, reclamações e dúvidas sobre estes termos: {EMAIL_PRIVACIDADE}.
      </p>
      <p>
        Estes termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor para resolver
        qualquer questão relacionada a eles.
      </p>
    </DocumentoLegal>
  );
}
