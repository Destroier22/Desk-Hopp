import { useState } from 'react';
import {
  LayoutDashboard, Ticket, MessageSquare, ClipboardList,
  FolderKanban, Box, BarChart3, Wallet, BookOpen,
  UserPlus, Settings, ShieldCheck, Download
} from 'lucide-react';

export function Sidebar() {
  const [expandido, setExpandido] = useState(false);

  // Lista com os itens do menu baseados no Milvus
  const itensMenu = [
    { icone: LayoutDashboard, texto: 'Dashboards', ativo: true },
    { icone: Ticket, texto: 'Tickets' },
    { icone: MessageSquare, texto: 'Chat' },
    { icone: ClipboardList, texto: 'Tarefas' },
    { icone: FolderKanban, texto: 'Projetos' },
    { icone: Box, texto: 'Inventário' },
    { icone: BarChart3, texto: 'Relatórios' },
    { icone: Wallet, texto: 'Faturamento' },
    { icone: BookOpen, texto: 'Base de conhecimento' },
    { icone: UserPlus, texto: 'Cadastros' },
    { icone: Settings, texto: 'Configurações' },
    { icone: ShieldCheck, texto: 'Proteção Geral de Dados' },
    { icone: Download, texto: 'Download de Agentes' },
  ];

  return (
    <div
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      className={`h-screen bg-[#1e1e24] border-r border-gray-800 text-gray-400 flex flex-col justify-between p-2 relative transition-all duration-300 select-none ${
        expandido ? 'w-64' : 'w-16'
      }`}
    >
      {/* Topo / Logo */}
      <div>
        <div className="flex items-center justify-between h-14 px-2 mb-4">
          {expandido ? (
            <span className="text-xl font-bold text-white flex items-center gap-2">
              Desk Hopp <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded text-white font-normal">helpdesk</span>
            </span>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm mx-auto">
              H
            </div>
          )}
        </div>

        {/* Itens de Navegação */}
        <nav className="space-y-1">
          {itensMenu.map((item, index) => {
            const Icone = item.icone;
            return (
              <div
                key={index}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  item.ativo
                    ? 'bg-blue-600 text-white font-medium'
                    : 'hover:bg-gray-800 hover:text-gray-200'
                }`}
                title={!expandido ? item.texto : ''}
              >
                <Icone size={20} className="shrink-0" />
                <span className={`text-sm transition-opacity duration-200 ${
                  expandido ? 'opacity-100 block' : 'opacity-0 hidden'
                }`}>
                  {item.texto}
                </span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
