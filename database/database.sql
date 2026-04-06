CREATE DATABASE IF NOT EXISTS helpdesk_database;
USE helpdesk_database;

CREATE TABLE usuarios (
    idUsuario   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    senha       VARCHAR(255) NOT NULL,
    nivelAcesso ENUM('cliente', 'agente', 'admin') NOT NULL,
    createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE empresas (
    idEmpresa   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    cnpj        VARCHAR(18)  UNIQUE,
    email       VARCHAR(100),
    ativo       TINYINT(1)   NOT NULL DEFAULT 1,
    createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agentes (
    idAgente    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idUsuario   INT UNSIGNED NOT NULL UNIQUE,
    idEmpresa   INT UNSIGNED,
    cargo       VARCHAR(50)  NOT NULL DEFAULT 'agente', 
    disponivel  TINYINT(1)   NOT NULL DEFAULT 1,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idEmpresa) REFERENCES empresas(idEmpresa),
    KEY idx_agentes_idEmpresa (idEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chamados (
    idChamado     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    protocolo     VARCHAR(20)  NOT NULL UNIQUE,  
    idCliente     INT UNSIGNED NOT NULL,
    idAgente      INT UNSIGNED,                  
    idEmpresa     INT UNSIGNED,
    titulo        VARCHAR(150) NOT NULL,
    descricao     TEXT         NOT NULL,         
    categoria     VARCHAR(50)  NULL,
    status        ENUM('aberto','em_atendimento','aguardando_cliente','concluido','cancelado') NOT NULL DEFAULT 'aberto',
    prioridade    ENUM('baixa','media','alta') NOT NULL DEFAULT 'media',
    anexo         VARCHAR(500),
    mimeTypeAnexo VARCHAR(100),
    createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idCliente) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idAgente)  REFERENCES agentes(idAgente),
    FOREIGN KEY (idEmpresa) REFERENCES empresas(idEmpresa),
    KEY idx_chamados_status (status),
    KEY idx_chamados_idCliente (idCliente),
    KEY idx_chamados_idAgente (idAgente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE chat_mensagens (
    idMensagem    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idChamado     INT UNSIGNED NOT NULL,
    idRemetente   INT UNSIGNED NOT NULL,
    mensagem      TEXT,
    anexo         VARCHAR(500),
    mimeTypeAnexo VARCHAR(100),
    lida          TINYINT(1)   NOT NULL DEFAULT 0,
    createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idChamado)   REFERENCES chamados(idChamado),
    FOREIGN KEY (idRemetente) REFERENCES usuarios(idUsuario),
    KEY idx_chat_idChamado (idChamado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notificacoes (
    idNotificacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idUsuario     INT UNSIGNED NOT NULL,
    idChamado     INT UNSIGNED,
    tipo          ENUM('novo_chamado','nova_mensagem','chamado_concluido','chamado_cancelado') NOT NULL,
    lida          TINYINT(1)   NOT NULL DEFAULT 0,
    createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idChamado) REFERENCES chamados(idChamado),
    KEY idx_notificacoes_idUsuario (idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
