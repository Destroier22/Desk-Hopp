import type { FormEvent } from 'react';
import { Lock, LogIn, Mail } from 'lucide-react';

interface LoginScreenProps {
  emailLogin: string;
  senhaLogin: string;
  loginCarregando: boolean;
  loginErro: string;
  onEmailChange: (valor: string) => void;
  onSenhaChange: (valor: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function LoginScreen({
  emailLogin,
  senhaLogin,
  loginCarregando,
  loginErro,
  onEmailChange,
  onSenhaChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#121214] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1e24] border border-gray-800 rounded-lg p-6 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">H</div>
          <h1 className="text-2xl font-bold tracking-wide">Desk Work</h1>
          <p className="text-xs text-gray-500 mt-1">Acesso ao helpdesk</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
            <div className="flex items-center gap-2 bg-[#121214] border border-gray-700 rounded px-3 focus-within:border-blue-500">
              <Mail size={15} className="text-gray-500" />
              <input
                type="email"
                value={emailLogin}
                onChange={(e) => onEmailChange(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none"
                placeholder="usuario@empresa.com"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
            <div className="flex items-center gap-2 bg-[#121214] border border-gray-700 rounded px-3 focus-within:border-blue-500">
              <Lock size={15} className="text-gray-500" />
              <input
                type="password"
                value={senhaLogin}
                onChange={(e) => onSenhaChange(e.target.value)}
                className="w-full bg-transparent py-2.5 text-sm text-white outline-none"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          {loginErro && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">
              {loginErro}
            </div>
          )}

          <button
            type="submit"
            disabled={loginCarregando}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogIn size={16} />
            {loginCarregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-[11px] text-gray-500 border-t border-gray-800 pt-4">
          Teste: admin@deskhopp.local / 123456
        </div>
      </div>
    </div>
  );
}
