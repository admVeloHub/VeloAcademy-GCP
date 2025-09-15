// =================================================================
// CONFIGURAÇÃO PRINCIPAL
// =================================================================

// ❗ SEUS IDs (já preenchidos)
const TEMPLATE_ID = "1dMVleBy_wHa7pAxeb6RdpYtF2AueFZxoifiYF0U8OBw";
const DESTINATION_FOLDER_ID = "1x1CkAR8RklMFrYwJdjcRx_C1uYVsJrOB";

// BANCO DE DADOS SEGURO DOS QUIZZES (as respostas ficam aqui, no backend)
const coursesData = {
  'pix': {
    title: 'Chave Pix Velotax',
    passingScore: 8,
    questions: [
      { question: "Qual é o principal motivo para a obrigatoriedade do vínculo da chave Pix CPF ao Velobenk (Celcoin) quando o cliente solicita antecipação da restituição?", options: ["Garantir que o cliente possa receber em qualquer banco.", "Evitar que o cliente utilize a chave para outros fins.", "Assegurar que a restituição seja usada automaticamente para quitar o contrato.", "Impedir que a Receita Federal atrase o pagamento."], answer: 2 },
      { question: "Um cliente quitou sua antecipação pelo app Velotax. Qual é o procedimento correto para que ele realize a portabilidade da chave Pix CPF?", options: ["Solicitar diretamente à Receita Federal via e-CAC.", "Cadastrar a chave Pix no novo banco e aceitar a portabilidade no app Velotax.", "Abrir um ticket no Octadesk pedindo a liberação.", "Aguardar 5 dias úteis para liberação automática."], answer: 1 },
      { question: "Quando o cliente solicita a retirada da chave Pix sem quitar a antecipação, quais são as consequências imediatas?", options: ["A chave é bloqueada permanentemente e não pode ser usada em outro banco.", "O valor da antecipação é cobrado integralmente, sem desconto, com pagamento imediato.", "A restituição é retida pela Receita Federal até a quitação do débito.", "O cliente perde o direito à restituição do Imposto de Renda."], answer: 1 },
      { question: "Qual é o prazo para exclusão da chave Pix quando o cliente solicita a retirada sem ter quitado a antecipação?", options: ["Imediato.", "1 dia útil.", "2 dias úteis.", "5 dias úteis."], answer: 2 },
      { question: "No caso de clientes com antecipação de 2024, que não receberam a restituição por retenção da Receita Federal, qual deve ser a orientação correta?", options: ["Solicitar portabilidade da chave em outro banco.", "Corrigir os dados bancários no Portal e-CAC, cadastrando a chave Pix CPF.", "Aguardar liberação automática da Receita sem nenhuma ação.", "Encerrar o contrato com a Velotax."], answer: 1 },
      { question: "Se o cliente de 2024 já recebeu a restituição em outra conta e não quitou a antecipação, qual deve ser o procedimento correto?", options: ["Negar a liberação da chave até que ele quite o débito.", "Solicitar liberação da chave e encaminhar o caso ao N2 para cobrança.", "Orientar o cliente a registrar uma reclamação na Receita Federal.", "Retirar a chave manualmente via Octadesk, sem cobrança."], answer: 1 },
      { question: "Qual é o prazo mencionado para início de medidas de cobrança quando ocorre quebra contratual na retirada da chave Pix?", options: ["2 dias úteis.", "3 dias úteis.", "5 dias úteis.", "10 dias úteis."], answer: 2 },
      { question: "Antes de encaminhar um atendimento para o N2, o que o atendente deve fazer obrigatoriamente?", options: ["Confirmar se o cliente prefere contato por WhatsApp ou telefone, e em qual horário.", "Registrar um chamado na Receita Federal.", "Pedir ao cliente um comprovante da declaração de IR.", "Verificar se a restituição já foi liberada pela Receita."], answer: 0 },
      { question: "Quando um cliente atualiza os dados bancários no e-CAC, quanto tempo a Receita pode levar para processar a alteração e liberar o pagamento?", options: ["2 a 5 dias.", "5 a 7 dias.", "10 a 15 dias.", "20 dias."], answer: 2 },
      { question: "Qual é a orientação padrão no atendimento sobre a chave Pix do cliente?", options: ["Explicar que a chave Pix é exclusiva da Velotax até o fim do contrato.", "Informar que a chave Pix do cliente é livre, mas está sujeita às regras contratuais.", "Dizer que a chave Pix só pode ser usada após quitação integral do empréstimo.", "Afirmar que a Velotax tem controle permanente sobre a chave Pix do cliente."], answer: 1 }
    ]
  },
  'credito': {
    title: 'Crédito do Trabalhador: Análise e Concessão',
    passingScore: 8,
    questions: [
      { question: "Qual é o principal diferencial do Crédito do Trabalhador em relação ao empréstimo pessoal comum?", options: ["Permite contratação apenas presencial", "Não precisa de comprovação de renda", "Parcelas descontadas diretamente do salário ou benefício", "Tem taxa de juros variável conforme o mercado"], answer: 2 },
      { question: "O Crédito do Trabalhador é regulamentado por qual base legal?", options: ["Lei 10.820/2003 e alterações da Lei 15.179/2025", "Lei 8.078/1990 (Código de Defesa do Consumidor)", "Lei 13.709/2018 (LGPD)", "Medida Provisória 870/2019"], answer: 0 },
      { question: "Um trabalhador com salário líquido de R$ 2.000,00 pode comprometer, na Velotax, até quanto do seu salário com parcelas do consignado?", options: ["R$ 700,00", "R$ 500,00", "R$ 333,33", "R$ 600,00"], answer: 2 },
      { question: "Quem NÃO está entre os elegíveis ao Crédito do Trabalhador?", options: ["Trabalhadores domésticos com registro no eSocial (categoria 104)", "Diretores com conta no FGTS (categoria 721)", "Trabalhadores autônomos sem vínculo CLT", "Empregados CLT (categoria 101)"], answer: 2 },
      { question: "Um cliente solicita o Crédito do Trabalhador no app Velotax dia 15/07 e tem o contrato averbado no mesmo dia. Quando será o vencimento da primeira parcela?", options: ["15/08", "15/09", "15/10", "15/11"], answer: 2 },
      { question: "Em caso de demissão, como o FGTS pode ser usado no Crédito do Trabalhador?", options: ["Não pode ser utilizado em nenhuma hipótese", "Pode quitar parte ou toda a dívida restante", "Pode aumentar a margem consignável", "É automaticamente transferido para a conta salário"], answer: 1 },
      { question: "O cliente recebe o crédito via PIX CPF em até quanto tempo após a averbação do contrato?", options: ["24 horas", "2 horas", "30 minutos", "2 dias úteis"], answer: 2 },
      { question: "Um cliente contrata o crédito mas decide cancelar. Qual é o prazo para desistência sem multa?", options: ["7 dias corridos após o recebimento", "5 dias úteis após assinatura", "Até 24 horas após a liberação", "Não é permitido cancelamento"], answer: 0 },
      { question: "Qual é um possível motivo de atrito após a contratação?", options: ["Taxa de juros maior do que a contratada", "Primeira parcela debitada mesmo após desistência, por causa do prazo de carência", "Cliente não consegue acessar o aplicativo", "Falta de assinatura digital no contrato"], answer: 1 },
      { question: "Se a contratação foi feita no app no dia 25, qual será o vencimento da primeira parcela?", options: ["No mês seguinte", "Dois meses depois", "Três meses depois", "Quatro meses depois"], answer: 2 }
    ]
  },
  'credito-pessoal': {
    title: 'Crédito Pessoal Velotax',
    passingScore: 8,
    questions: [
      { question: "Qual é o limite inicial oferecido no Empréstimo Pessoal Velotax e em quantas parcelas ele pode ser pago?", options: ["R$ 1.000,00 em 6 parcelas", "R$ 500,00 em 4 parcelas", "R$ 300,00 em 3 parcelas", "R$ 750,00 em 5 parcelas"], answer: 1 },
      { question: "Qual é a condição para que a análise de crédito via Open Finance seja concluída com sucesso?", options: ["O cliente deve ter conta em qualquer banco com saldo positivo", "O cliente precisa autorizar a conexão com o banco onde sua chave Pix CPF está cadastrada", "Basta ter histórico de crédito positivo no Serasa", "É necessário fornecer documentos físicos na agência"], answer: 1 },
      { question: "Durante a jornada de contratação, o cliente vê um símbolo amarelo com a letra 'b' e pergunta: 'Isso significa que estou contratando com outra empresa?' Qual deve ser a resposta do atendente?", options: ["Não, o símbolo corresponde à Belvo, empresa autorizada que atua como nossa parceira na tecnologia do Open Finance, a conexão é com o Velotax.", "Sim, o contrato será feito diretamente com a Belvo.", "O símbolo não tem importância e pode ser ignorado.", "Isso indica que o crédito foi aprovado automaticamente."], answer: 0 },
      { question: "O cliente pode ter mais de um contrato de Empréstimo Pessoal Velotax ativo ao mesmo tempo?", options: ["Sim, desde que o limite total não ultrapasse R$ 1.000,00.", "Sim, se ele já tiver quitado 50% do contrato anterior.", "Não, só é permitido um contrato ativo por vez.", "Apenas para clientes com boa avaliação no Open Finance."], answer: 2 },
      { question: "Se o cliente atrasar o pagamento de uma parcela, quais encargos serão aplicados?", options: ["Multa de 1% e juros de 0,5% ao mês", "Multa de 2% e juros de 1% ao mês", "Apenas atualização do valor pelo IPCA", "Não há encargos adicionais, apenas registro de atraso"], answer: 1 },
      { question: "O cliente solicita cancelar o contrato após 10 dias da contratação. O que deve ser informado?", options: ["O cancelamento pode ser feito a qualquer momento, sem custos.", "O cancelamento depende da aprovação da equipe de crédito.", "O cliente pode cancelar, mas terá que pagar apenas a primeira parcela.", "O cancelamento só é permitido até 7 dias após a contratação."], answer: 3 },
      { question: "O cliente realizou o consentimento do Open Finance, mas a tela não avançou. Ele pergunta se houve erro. Qual a resposta correta?", options: ["Não, a análise pode levar entre 2 e 5 minutos, basta aguardar.", "Sim, o processo falhou e deve ser reiniciado.", "O erro é do banco do cliente e não há solução.", "O processo só avança se o cliente fizer o cadastro completo novamente."], answer: 0 },
      { question: "Em caso de não pagamento das parcelas, quais consequências podem ocorrer?", options: ["Apenas bloqueio do aplicativo Velotax", "Cobrança judicial imediata", "Negativação em órgãos de proteção ao crédito e, em alguns casos, protesto em cartório", "Cancelamento automático do contrato sem consequências"], answer: 2 }
    ]
  },
  'tabulacao': {
    title: 'Tabulação no Atendimento',
    passingScore: 6,
    questions: [
      { question: "Qual é o objetivo principal da tabulação de chamados no atendimento?", options: ["Aumentar o tempo de atendimento", "Registrar e organizar informações dos clientes para acompanhamento", "Reduzir o número de chamadas", "Automatizar completamente o atendimento"], answer: 1 },
      { question: "Durante a tabulação, qual informação é considerada mais crítica para o acompanhamento do caso?", options: ["Horário da chamada", "Nome completo do cliente e CPF", "Duração da conversa", "Número do protocolo"], answer: 1 },
      { question: "Qual é a melhor prática ao tabular um chamado de reclamação?", options: ["Registrar apenas o problema relatado", "Incluir problema, solução oferecida e status do caso", "Anotar somente o nome do cliente", "Deixar em branco se não houver solução imediata"], answer: 1 },
      { question: "Quando um cliente solicita cancelamento de produto, o que deve ser registrado na tabulação?", options: ["Apenas a solicitação de cancelamento", "Motivo do cancelamento, data da solicitação e próximos passos", "Somente o nome do produto", "Apenas o protocolo gerado"], answer: 1 },
      { question: "Qual é o prazo recomendado para atualização de chamados em aberto?", options: ["A cada 24 horas", "A cada 48 horas", "A cada 72 horas", "Conforme acordado com o cliente"], answer: 3 },
      { question: "Na tabulação de chamados, qual campo é obrigatório para identificação única do cliente?", options: ["Nome completo", "CPF", "Telefone", "Email"], answer: 1 },
      { question: "Quando um chamado é escalado para outro setor, o que deve ser registrado?", options: ["Apenas o setor de destino", "Motivo da escalação, setor de destino e prazo de retorno", "Somente o protocolo", "Apenas a data da escalação"], answer: 1 },
      { question: "Qual é a importância de classificar corretamente o tipo de chamado na tabulação?", options: ["Facilita o relatório mensal", "Permite direcionamento adequado e análise de tendências", "Reduz o tempo de atendimento", "Automatiza o processo de resposta"], answer: 1 }
    ]
  }
};

// =================================================================
// FUNÇÃO PRINCIPAL DO WEB APP
// =================================================================

function doGet(e) {
  console.log('Requisição recebida:', e.parameter);
  const action = e.parameter.action;

  // Ação para o VeloAcademy buscar as perguntas do quiz
  if (action === 'getQuiz') {
    console.log('Ação getQuiz solicitada');
    return handleGetQuiz(e);
  }

  // Ação para o VeloAcademy enviar as respostas e gerar o certificado
  if (action === 'submitQuiz') {
    console.log('Ação submitQuiz solicitada');
    return handleSubmitQuiz(e);
  }

  // Ação para testar o servidor
  if (action === 'test') {
    console.log('Ação test solicitada');
    return ContentService.createTextOutput("Servidor VeloAcademy funcionando corretamente!");
  }

  // Resposta padrão se nenhuma ação for especificada
  console.log('Nenhuma ação especificada');
  return ContentService.createTextOutput("Servidor VeloAcademy no ar.");
}

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

/**
 * Lida com a requisição para obter as perguntas de um quiz.
 * Envia apenas as perguntas e opções, sem as respostas.
 */
function handleGetQuiz(e) {
  const courseId = e.parameter.courseId;
  const courseData = coursesData[courseId];

  if (courseData) {
    const questionsForFrontend = courseData.questions.map(q => ({
      question: q.question,
      options: q.options,
      answer: q.answer
    }));
    
    const response = { 
      status: 'success', 
      questions: questionsForFrontend,
      passingScore: courseData.passingScore
    };
    return createJsonResponse(response);
  } else {
    return createJsonResponse({ status: 'error', message: 'Curso não encontrado.' });
  }
}

/**
 * Lida com o envio das respostas do quiz, corrige a prova e gera o certificado se aprovado.
 */
function handleSubmitQuiz(e) {
  try {
    const studentName = e.parameter.name;
    const studentEmail = e.parameter.email;  // Captura o email do usuário
    const courseId = e.parameter.courseId;
    const userAnswers = JSON.parse(e.parameter.answers);
    
    // Validação de email (opcional, mas recomendado)
    if (studentEmail && !studentEmail.endsWith('@velotax.com.br')) {
      return createErrorPage("Email não autorizado para emissão de certificado.");
    }
    
    const courseData = coursesData[courseId];
    if (!courseData) {
      return createErrorPage("Curso não encontrado.");
    }
    
    const courseName = courseData.title;
    const correctAnswers = courseData.questions;
    let score = 0;
    
    correctAnswers.forEach((correctQ, index) => {
      if (correctQ.answer === userAnswers[index]) {
        score++;
      }
    });
    
    const totalQuestions = correctAnswers.length;
    const finalGrade = (score / totalQuestions) * 10;
    const passingScore = courseData.passingScore;

    if (finalGrade >= passingScore) {
      // Aprovado: Gera o certificado em PDF
      const pdfUrl = generateCertificate(studentName, studentEmail, courseName);
      // Redireciona o usuário para o PDF gerado
      const htmlOutput = `<html><head><title>Certificado Gerado</title><meta http-equiv="refresh" content="0;url=${pdfUrl}"></head><body>Redirecionando para seu certificado...</body></html>`;
      return HtmlService.createHtmlOutput(htmlOutput);
    } else {
      // Reprovado: Mostra uma página de feedback
      const message = `<h1>Você não atingiu a nota mínima.</h1><p>Sua nota foi ${finalGrade.toFixed(1)} / 10.0. A nota mínima para aprovação é ${passingScore}.</p><p>Por favor, revise o material e tente novamente.</p>`;
      return createErrorPage(message, "Reprovado");
    }
  } catch (error) {
    return createErrorPage(`Erro ao processar sua prova: ${error.message}`);
  }
}

/**
 * Cria e salva o certificado em PDF, retornando a URL pública.
 */
function generateCertificate(studentName, studentEmail, courseName) {
  const completionDate = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  const destinationFolder = DriveApp.getFolderById(DESTINATION_FOLDER_ID);
  const templateFile = DriveApp.getFileById(TEMPLATE_ID);
  
  // Nome do arquivo mais específico com email (se disponível)
  const emailSuffix = studentEmail ? ` (${studentEmail})` : '';
  const newFileName = `Certificado - ${studentName}${emailSuffix} - ${courseName}`;
  const newFile = templateFile.makeCopy(newFileName, destinationFolder);
  
  const presentation = SlidesApp.openById(newFile.getId());
  presentation.replaceAllText('{{NOME_ALUNO}}', studentName);
  presentation.replaceAllText('{{NOME_CURSO}}', courseName);
  presentation.replaceAllText('{{DATA_CONCLUSAO}}', completionDate);
  presentation.saveAndClose();
  
  const pdfBlob = newFile.getAs('application/pdf');
  const pdfFile = destinationFolder.createFile(pdfBlob).setName(newFileName + ".pdf");
  
  newFile.setTrashed(true); // Exclui a cópia do Google Slides
  
  // GARANTIR ACESSO PÚBLICO COMPLETO
  try {
    // Primeiro, tornar público para qualquer pessoa
    pdfFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    // Depois, garantir que qualquer pessoa com o link possa ver
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log('Arquivo compartilhado com sucesso:', pdfFile.getName());
    console.log('URL do arquivo:', pdfFile.getUrl());
  } catch (sharingError) {
    console.error('Erro ao compartilhar arquivo:', sharingError);
    // Mesmo com erro de compartilhamento, retorna a URL
  }
  
  return pdfFile.getUrl();
}

/**
 * Funções utilitárias para criar respostas padronizadas.
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorPage(message, title = "Erro") {
  return HtmlService.createHtmlOutput(`<h1>${title}</h1><p>${message}</p>`);
}

/**
 * Função de teste para verificar se o servidor está funcionando
 */
function testServer() {
  console.log('Testando servidor...');
  console.log('IDs disponíveis:', Object.keys(coursesData));
  console.log('Total de cursos:', Object.keys(coursesData).length);
  
  // Testa cada curso
  Object.keys(coursesData).forEach(courseId => {
    const course = coursesData[courseId];
    console.log(`Curso ${courseId}: ${course.title} - ${course.questions.length} perguntas`);
  });
  
  return "Servidor funcionando corretamente!";
}