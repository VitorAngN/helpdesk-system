CREATE DATABASE IF NOT EXISTS helpdesk_database;
USE helpdesk_database;
    CREATE TABLE usuarios (
    idUsuario     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    senha         VARCHAR(255)  NOT NULL,         -- hash bcrypt
    nivelAcesso   ENUM('cliente', 'agente', 'admin') NOT NULL,
    createdAt     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updatedAt     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE empresas (
    idEmpresa     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    cnpj          VARCHAR(18)  UNIQUE,
    email         VARCHAR(100),
    ativo         TINYINT(1)   DEFAULT 1,
    createdAt     DATETIME     DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE agentes (
    idAgente        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idUsuario       INT UNSIGNED NOT NULL UNIQUE,
    idEmpresa       INT UNSIGNED,                  -- empresa à qual o agente pertence
    cargo           VARCHAR(50)  DEFAULT 'agente', 
    disponivel      TINYINT(1)   DEFAULT 1,
    FOREIGN KEY (idUsuario)  REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idEmpresa)  REFERENCES empresas(idEmpresa)
    );

    CREATE TABLE chamados (
    idChamado       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    protocolo       VARCHAR(20)  NOT NULL UNIQUE,  
    idCliente       INT UNSIGNED NOT NULL,
    idAgente        INT UNSIGNED,                  
    idEmpresa       INT UNSIGNED,
    titulo          VARCHAR(150) NOT NULL,
    descricao       TEXT         NOT NULL,         
    categoria       VARCHAR(50),
    status          ENUM('aberto','em_atendimento','aguardando_cliente','concluido','cancelado') DEFAULT 'aberto',
    prioridade      ENUM('baixa','media','alta')   DEFAULT 'media',
    anexo           VARCHAR(500),                  -- caminho do arquivo no servidor
    mimeTypeAnexo   VARCHAR(100),                  -- ex: applica.../pdf
    createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idAgente)  REFERENCES agentes(idAgente),
    FOREIGN KEY (idEmpresa) REFERENCES empresas(idEmpresa)
    );

    CREATE TABLE chat_mensagens (
    idMensagem    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idChamado     INT UNSIGNED NOT NULL,
    idRemetente   INT UNSIGNED NOT NULL,           -- para saber quem enviou (cliente ou agente)
    mensagem      TEXT,                            -- NULL se for só arquivo
    anexo         VARCHAR(500),                    -- caminho do arquivo
    mimeTypeAnexo VARCHAR(100),
    lida          TINYINT(1)   DEFAULT 0,
    createdAt     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idChamado)   REFERENCES chamados(idChamado),
    FOREIGN KEY (idRemetente) REFERENCES usuarios(idUsuario)
    );

    CREATE TABLE notificacoes (
    idNotificacao   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idUsuario       INT UNSIGNED NOT NULL,
    idChamado       INT UNSIGNED,
    tipo            ENUM('novo_chamado','nova_mensagem','chamado_concluido','chamado_cancelado') NOT NULL,
    lida            TINYINT(1)   DEFAULT 0,
    createdAt       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idChamado) REFERENCES chamados(idChamado)
    );

