// Textos em português (idioma padrão). en.ts e es.ts seguem exatamente esta estrutura.

export const pt = {
  meta: {
    titulo: "MiraV · VisaVision, o espelho inteligente",
    descricao:
      "O VisaVision é o espelho inteligente da MiraV: mostra cortes, cores e procedimentos no reflexo do próprio cliente, antes do primeiro corte.",
  },
  assinatura: "Mais certeza para o cliente, mais resultado para o seu negócio.",
  menu: {
    produtos: "Produtos",
    sobre: "Sobre",
    contato: "Contato",
    trabalhe: "Trabalhe Conosco",
    abrir: "Abrir menu",
    fechar: "Fechar menu",
    inicio: "MiraV, página inicial",
    idioma: "Idioma",
    temaEscuro: "Tema escuro",
  },
  carregando: "Preparando o espelho",
  hero: {
    rotulo: "VisaVision · espelho inteligente",
    titulo1: "Seu cliente vê o resultado",
    destaque: "antes",
    titulo2: "do primeiro corte.",
    texto:
      "O VisaVision é o espelho inteligente da MiraV. Ele mostra cortes, cores e procedimentos no reflexo do próprio cliente e transforma dúvida em serviço vendido.",
    ctaPrincipal: "Solicitar demonstração",
    ctaSecundario: "Conhecer os modelos",
    simulacao: "Simulação",
    grupoAlteracao: "Tipo de alteração",
    grupoTom: "Tom da cor",
    opcoes: { corte: "Corte", cor: "Cor", barba: "Barba", estetica: "Estética" },
    tons: { platinado: "Platinado", mel: "Mel", violeta: "Violeta" },
    nomes: {
      corte: "Corte curto",
      cor: "Cor",
      barba: "Barba feita",
      estetica: "Pele uniformizada",
    },
    marcas: ["Topete · 6 cm", "Franja para cima", "Degradê 0 → 3"],
    aviso: "Simulação ilustrativa: o resultado final depende do profissional.",
    altAntes: "Rosto no espelho antes da simulação",
    role: "Role para conhecer",
  },
  manifesto: {
    rotulo: "Manifesto",
    frase: "Mais certeza para o cliente, mais resultado para o seu negócio.",
    texto:
      "Toda transformação começa com uma dúvida: e se não ficar bom? O VisaVision responde antes da tesoura, da tinta ou do procedimento. O cliente decide com segurança, o profissional trabalha com clareza e o negócio vende mais, com menos retrabalho.",
  },
  resultados: {
    rotulo: "Resultados",
    titulo: "O que muda quando o cliente",
    destaque: "vê antes.",
    itens: [
      { valor: 38, prefixo: "+", sufixo: "%", texto: "em serviços adicionais por atendimento" },
      { valor: 62, prefixo: "−", sufixo: "%", texto: "em pedidos de retoque e retrabalho" },
      { valor: 4.8, prefixo: "", sufixo: "/5", texto: "de satisfação após o atendimento" },
      { valor: 12, prefixo: "", sufixo: " s", texto: "para o cliente ver a primeira simulação" },
    ],
    nota: "Estimativas da MiraV. Os resultados variam conforme o perfil de cada negócio.",
  },
  publico: {
    rotulo: "Para quem",
    titulo: "Feito para quem transforma",
    destaque: "aparências.",
    abrir: "Ver detalhes",
    itens: [
      {
        nome: "Barbearias",
        resumo: "Cortes e barbas aprovados antes da máquina.",
        detalhe:
          "O cliente compara degradês, topetes e estilos de barba no próprio rosto. O barbeiro recebe o pedido com nome e medidas, e a conversa fica mais rápida.",
      },
      {
        nome: "Salões de beleza",
        resumo: "Cor e comprimento sem arrependimento.",
        detalhe:
          "Mudanças grandes, como platinado ou um chanel, deixam de ser um salto no escuro. A cliente vê o tom no próprio cabelo e aprova com confiança.",
      },
      {
        nome: "Clínicas de estética",
        resumo: "Expectativa alinhada antes do procedimento.",
        detalhe:
          "Uniformização de pele, sobrancelhas e outros procedimentos aparecem como simulação ilustrativa, o que ajuda a alinhar expectativas desde a consulta.",
      },
      {
        nome: "Estúdios de coloração",
        resumo: "Tons testados em segundos.",
        detalhe:
          "Do mel ao violeta, o espelho mostra várias opções em sequência. Menos testes de mecha, mais decisões tomadas na cadeira.",
      },
    ],
  },
  fluxo: {
    rotulo: "Como o espelho trabalha",
    titulo: "Do reflexo à decisão em",
    destaque: "cinco passos.",
    etapas: [
      { nome: "Cliente", texto: "Senta diante do VisaVision e diz o que deseja mudar, ou escolhe no catálogo do espaço." },
      { nome: "Espelho", texto: "Mostra o reflexo em tempo real e aplica a alteração escolhida sobre o próprio rosto." },
      { nome: "IA", texto: "Reconhece o estilo, sugere alternativas e traduz o pedido em termos técnicos." },
      { nome: "Profissional", texto: "Recebe o pedido claro, com nome do corte, medidas e referências visuais." },
      { nome: "Resultado", texto: "O cliente sai com o que viu e aprovou. Menos retrabalho, mais retorno." },
    ],
  },
  casos: {
    rotulo: "Casos",
    titulo: "Histórias de quem",
    destaque: "decidiu com certeza.",
    nota: "Exemplos de uso",
    anterior: "Caso anterior",
    proximo: "Próximo caso",
    itens: [
      {
        local: "Barbearia · São Paulo",
        titulo: "Do “só aparar” ao degradê com topete",
        texto:
          "O cliente testou três estilos no espelho e escolheu um corte mais ousado do que pretendia. O atendimento subiu de categoria sem nenhuma insistência do barbeiro.",
        numero: "+45%",
        numeroTexto: "no valor do atendimento",
      },
      {
        local: "Salão · Fortaleza",
        titulo: "O platinado aprovado de primeira",
        texto:
          "A cliente tinha receio de clarear. Ao ver o tom no próprio reflexo, fechou o serviço completo e voltou para manutenção.",
        numero: "0",
        numeroTexto: "retoques no primeiro mês",
      },
      {
        local: "Clínica · Recife",
        titulo: "Consulta mais curta, expectativa alinhada",
        texto:
          "A simulação de pele uniformizada serviu de ponto de partida para a conversa sobre o procedimento, com a ressalva de que é ilustrativa.",
        numero: "−30%",
        numeroTexto: "no tempo de consulta",
      },
    ],
    conversa: {
      titulo: "Atendimento com o VisaVision",
      mensagens: [
        { de: "cliente", texto: "Quero mudar, mas tenho medo de não combinar." },
        { de: "espelho", texto: "Vamos testar. Passe a mão sobre o reflexo para ver o corte curto na máquina." },
        { de: "cliente", texto: "Gostei! E com a barba feita?" },
        { de: "espelho", texto: "Pronto. Envio para o barbeiro: topete 6 cm, degradê 0 → 3, barba feita." },
        { de: "profissional", texto: "Recebido. Começamos?" },
      ],
    },
  },
  modelos: {
    rotulo: "Modelos",
    titulo: "Um espelho para cada",
    destaque: "espaço.",
    cta: "Ver todos os modelos",
    nomes: { retangular: "Retangular", oval: "Oval", arco: "Arco", redondo: "Redondo", personalizado: "Personalizado" },
  },
  chamada: {
    titulo: "Mostre o resultado",
    destaque: "antes.",
    texto: "Agende uma demonstração do VisaVision no seu espaço.",
    cta: "Solicitar demonstração",
  },
  miro: {
    repetir: "Ouvir o Miro de novo",
    falas: {
      hero: [
        "Oi! Eu sou o Miro, o assistente da MiraV.",
        "Passe o mouse ou o dedo no espelho para ver o novo visual.",
        "Nos botões, você troca entre corte, cor, barba e estética.",
      ],
      manifesto: [
        "Toda mudança começa com uma dúvida: e se não ficar bom?",
        "O VisaVision responde antes da tesoura.",
      ],
      resultados: [
        "Estes são os resultados que a MiraV estima para os parceiros.",
        "Mais serviços por atendimento e menos retrabalho.",
      ],
      publico: [
        "O VisaVision foi feito para quem transforma.",
        "Escolha um tipo de negócio para ver como o espelho ajuda.",
      ],
      fluxo: [
        "Este é o caminho do cliente até o resultado.",
        "Escolha uma etapa para ver o que acontece nela.",
      ],
      casos: [
        "Aqui estão exemplos de uso no dia a dia.",
        "Use as setas para trocar de exemplo.",
        "Ao lado, uma conversa de atendimento com o espelho.",
      ],
      modelos: [
        "São cinco formatos de espelho.",
        "Na página de Produtos, eu conto onde cada um fica melhor!",
      ],
      chamada: [
        "Gostou? Agende uma demonstração no seu espaço!",
      ],
    },
  },
  rodape: {
    projeto: "Projeto acadêmico",
    desenvolvido: "Site desenvolvido por",
    direitos: "Todos os direitos reservados.",
    navegacao: "Navegação",
  },
  produtos: {
    rotulo: "Produtos",
    titulo: "VisaVision em",
    destaque: "cinco formatos.",
    texto:
      "A mesma inteligência em molduras pensadas para cada tipo de espaço. Todos os modelos mostram corte, cor, barba e estética no reflexo do cliente.",
    indicado: "Indicado para",
    medidas: "Medidas",
    aDefinir: "A definir",
    sobMedida: "Sob medida",
    recursosTitulo: "Em todos os modelos",
    recursos: [
      { titulo: "Simulação no reflexo", texto: "Corte, cor, barba e estética aplicados ao rosto do próprio cliente." },
      { titulo: "IA de visagismo", texto: "Reconhece cortes por foto e traduz o pedido para o profissional." },
      { titulo: "Catálogo do seu espaço", texto: "Os serviços e preços que você oferece, em destaque no espelho." },
      { titulo: "Privacidade", texto: "Fotos não são guardadas. Só o resultado da análise fica registrado." },
    ],
    cta: "Quero este modelo",
    assistente: {
      nome: "Miro",
      falas: {
        retangular: [
          "Oi! Eu fico na bancada, de frente para a cadeira.",
          "O cliente senta e compara o antes e o depois lado a lado.",
          "Perfeito para a estação de corte de barbearias e salões.",
        ],
        oval: [
          "Me coloque na parede, na altura do rosto.",
          "Com o cliente em pé, a moldura oval valoriza o rosto.",
          "Sou ótimo para coloração e maquiagem.",
        ],
        arco: [
          "Meu lugar é na recepção ou na vitrine.",
          "Chamo a atenção de quem passa e já começo o atendimento.",
          "Ideal para lojas, eventos e espaços com movimento.",
        ],
        redondo: [
          "Sou compacto: fico na mesa ou na mão do cliente.",
          "Ele me segura e vê barba, sobrancelha e pele de pertinho.",
          "Feito para consultas rápidas em clínicas e barbearias.",
        ],
        personalizado: [
          "Me conte como é o seu espaço.",
          "Formato, tamanho e acabamento são desenhados sob medida.",
          "Para quem quer um espelho com a cara da marca.",
        ],
      },
    },
    itens: {
      retangular: {
        descricao: "Amplo, para bancadas: compara antes e depois lado a lado.",
        indicado: "Barbearias e salões com bancadas",
      },
      oval: {
        descricao: "Moldura suave que valoriza o rosto. Ideal para coloração e maquiagem.",
        indicado: "Salões de beleza e estúdios de coloração",
      },
      arco: {
        descricao: "Topo arredondado e base reta: presença de vitrine.",
        indicado: "Recepções, lojas e eventos",
      },
      redondo: {
        descricao: "Compacto, para consultas rápidas de pele, sobrancelha e barba.",
        indicado: "Clínicas de estética e espaços pequenos",
      },
      personalizado: {
        descricao: "Formato, tamanho e acabamento sob medida para a identidade do seu espaço.",
        indicado: "Redes e projetos especiais",
      },
    },
  },
  sobre: {
    rotulo: "Sobre",
    titulo: "A MiraV une o salão de luxo e o",
    destaque: "laboratório de tecnologia.",
    texto:
      "Nascemos para tirar a incerteza da transformação visual. O VisaVision é o nosso primeiro produto: um espelho que mostra o resultado antes que ele aconteça.",
    pilares: [
      { titulo: "Missão", texto: "Dar a cada cliente a certeza do resultado antes da transformação." },
      { titulo: "Visão", texto: "Ser referência em tecnologia para beleza e estética na América Latina." },
      {
        titulo: "Valores",
        texto: "Transparência no que é simulação, respeito à privacidade, cuidado com o detalhe e foco no resultado do parceiro.",
      },
    ],
    equipeTitulo: "Equipe",
    equipeTexto: "As pessoas por trás da MiraV.",
    diretoria: {
      linkedin: "LinkedIn de {nome} (abre em nova aba)",
      rotulo: "Diretoria da MiraV",
      diaADia: "No dia a dia",
      frentes: "Frentes",
      anterior: "Anterior",
      proximo: "Próximo",
    },
  },
  form: {
    nome: "Nome completo",
    email: "E-mail",
    telefone: "Telefone",
    opcional: "opcional",
    empresa: "Empresa ou espaço",
    tipoNegocio: "Tipo de negócio",
    selecione: "Selecione",
    tiposNegocio: {
      barbearia: "Barbearia",
      salao: "Salão de beleza",
      clinica: "Clínica de estética",
      coloracao: "Estúdio de coloração",
      rede: "Rede ou franquia",
      outro: "Outro",
    },
    area: "Área de interesse",
    areas: {
      desenvolvimento: "Desenvolvimento",
      design: "Design",
      ia: "Inteligência artificial",
      comercial: "Comercial",
      atendimento: "Atendimento e suporte",
      outra: "Outra",
    },
    link: "LinkedIn ou portfólio",
    mensagem: "Mensagem",
    consentimento:
      "Autorizo a MiraV a usar estes dados para responder a este contato, conforme a Lei Geral de Proteção de Dados (LGPD).",
    enviar: "Enviar",
    enviando: "Enviando…",
    sucessoTitulo: "Mensagem recebida.",
    sucessoTexto: "Obrigado. Nossa equipe responderá pelo e-mail informado.",
    interesseModelo: "Tenho interesse no modelo {modelo}. ",
    interesseVaga: "Olá! Quero me candidatar à vaga de {vaga}. ",
    novo: "Enviar outra mensagem",
    erros: {
      tamanho: "Verifique o tamanho deste campo.",
      formato: "Formato inválido.",
      obrigatorio: "Campo obrigatório.",
      opcao: "Escolha uma opção.",
      rede: "Não foi possível falar com o servidor. Verifique a conexão e tente novamente.",
    },
  },
  contato: {
    rotulo: "Contato",
    titulo: "Vamos levar o VisaVision",
    destaque: "ao seu espaço.",
    texto: "Conte um pouco sobre o seu negócio. Respondemos com uma proposta de demonstração.",
    placeholderMensagem: "Ex.: tenho uma barbearia com 4 bancadas e quero conhecer o modelo retangular.",
  },
  trabalhe: {
    rotulo: "Trabalhe Conosco",
    titulo: "Construa o futuro da beleza",
    destaque: "com a gente.",
    texto: "Buscamos pessoas curiosas, cuidadosas e com vontade de unir tecnologia e estética.",
    placeholderMensagem: "Conte sobre você, o que já fez e por que quer trabalhar na MiraV.",
    candidaturaTitulo: "Envie sua candidatura",
    candidaturaTexto: "Escolheu uma vaga ou quer deixar seu currículo para as próximas? Preencha o formulário.",
  },
  vagas: {
    rotulo: "Vagas abertas",
    titulo: "Vagas abertas",
    texto: "{n} cargos com contratação CLT.",
    aviso: "Vagas ilustrativas do projeto acadêmico",
    filtro: "Filtrar por área",
    todas: "Todas",
    areas: {
      rh: "Recursos Humanos",
      administrativo: "Administrativo e Financeiro",
      comercial: "Comercial e Marketing",
      logistica: "Logística e Distribuição",
      producao: "Produção e Operação",
      qualidade: "Qualidade",
      tecnologia: "Tecnologia e IA",
    },
    umaVaga: "1 vaga",
    variasVagas: "{n} vagas",
    verDetalhes: "Ver detalhes",
    voltar: "Todas as vagas",
    regime: "Contratação",
    regimeValor: "CLT",
    escala: "Escala",
    escalaValor: "5x2",
    horario: "Horário",
    horarioValor: "8h às 17h",
    salario: "Salário",
    salarioValor: "Salário competitivo com o mercado",
    requisitos: "Requisitos e qualificações",
    atribuicoes: "Atribuições",
    responsabilidades: "Principais responsabilidades",
    beneficios: "Benefícios oferecidos",
    beneficiosLista: [
      "Vale-refeição de R$ 660 por mês",
      "Vale-transporte",
      "Plano de saúde empresarial, com mensalidade descontada em folha",
      "Plano odontológico, com parte da mensalidade paga pela empresa",
      "Wellhub (academias e apps de bem-estar) com preço corporativo",
      "Seguro de vida em grupo",
    ],
    direitos: "Além dos direitos garantidos pela CLT: 13º salário, férias remuneradas com 1/3 a mais e FGTS.",
    candidatar: "Candidatar-se a esta vaga",
  },
  qr: {
    titulo: "Aponte a câmera do celular",
    texto: "e conheça o VisaVision.",
  },
  naoEncontrada: {
    titulo: "Este reflexo não existe.",
    texto: "A página que você procura não foi encontrada.",
    voltar: "Voltar ao início",
  },
};

export type Dicionario = typeof pt;
