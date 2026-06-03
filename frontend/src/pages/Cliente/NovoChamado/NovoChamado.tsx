import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContextValue';
import Layout from '../../../components/Layout/Layout';
import './NovoChamado.css';

interface Categoria {
  idCategoria: number;
  nome: string;
}

export default function NovoChamado() {
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  // Estados dos campos
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriasLista, setCategoriasLista] = useState<Categoria[]>([]);
  const [prioridade, setPrioridade] = useState('Baixa');
  const [descricao, setDescricao] = useState('');
  
  // Fake state para arquivos
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategorias() {
      try {
        const res = await api.get('/categorias');
        setCategoriasLista(res.data);
        if (res.data.length > 0) {
          setCategoria(res.data[0].nome);
        } else {
          setCategoria('Geral'); // fallback
        }
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      }
    }
    loadCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!titulo || !descricao) {
      alert("Por favor, preencha o título e a descrição.");
      return;
    }

    setLoading(true);
    try {
      let urlAnexo = "";
      let mimeTypeAnexo = "";

      // Upload real do arquivo via Multer
      if (arquivoSelecionado) {
        const formData = new FormData();
        formData.append('arquivo', arquivoSelecionado);
        const resUpload = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        urlAnexo = resUpload.data.url;
        mimeTypeAnexo = resUpload.data.mimeType;
      }

      await api.post('/chamados', {
        idCliente: usuario?.idUsuario,
        titulo,
        descricao,
        categoria,
        prioridade: prioridade.toLowerCase().replace("é", "e"),
        anexo: urlAnexo,
        mimeTypeAnexo
      });

      navigate('/cliente');
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      alert("Não foi possível criar o chamado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="Cliente">
      <div className="new-ticket-container">
        
        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h2>Novo chamado de suporte</h2>
        </div>

        {/* FORMULÁRIO */}
        <form className="new-ticket-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titulo">Título do problema</label>
            <input 
              type="text" 
              id="titulo" 
              placeholder="Descreva resumidamente o problema..." 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="categoria">Categoria</label>
              <select 
                id="categoria" 
                value={categoria} 
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categoriasLista.length === 0 && <option value="Geral">Geral</option>}
                {categoriasLista.map(cat => (
                  <option key={cat.idCategoria} value={cat.nome}>{cat.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="prioridade">Prioridade</label>
              <select 
                id="prioridade" 
                value={prioridade} 
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição detalhada</label>
            <textarea 
              id="descricao" 
              rows={4} 
              placeholder="Descreva o problema com o máximo de detalhes possível. Quando começou? O que você já tentou?"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Anexo (opcional)</label>
            <div className="upload-area">
              <input 
                type="file" 
                id="file-upload" 
                style={{display: 'none'}} 
                onChange={(e) => setArquivoSelecionado(e.target.files ? e.target.files[0] : null)}
              />
              <label htmlFor="file-upload" className="upload-label" style={{cursor: 'pointer', display: 'block', width: '100%'}}>
                {arquivoSelecionado ? (
                  <p style={{color: '#60a5fa'}}>{arquivoSelecionado.name}</p>
                ) : (
                  <>
                    <p>Arraste um arquivo ou <span className="link-click">clique para selecionar</span></p>
                    <p className="upload-hints">PDF, PNG, JPG — máx. 10MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Redigindo...' : 'Abrir chamado'}
            </button>
          </div>
        </form>

      </div>
    </Layout>
  );
}
