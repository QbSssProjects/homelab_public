import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { loginWithEmail, registerWithEmail } from '../../config/firebase';

/**
 * Login/Register view component
 * @param {Function} onLoginSuccess - Callback when login succeeds
 */
const LoginView = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = isRegistering
            ? await registerWithEmail(email, password)
            : await loginWithEmail(email, password);

        if (result.success) {
            toast.success(isRegistering ? 'Konto utworzone!' : 'Zalogowano!');
            onLoginSuccess(result.user);
        } else {
            toast.error(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                        <span className="text-4xl">🏠</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Homelab Ewidencja
                    </h1>
                    <p className="text-gray-600">
                        {isRegistering ? 'Utwórz nowe konto' : 'Zaloguj się do systemu'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="twoj@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hasło
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Przetwarzanie...
              </span>
                        ) : (
                            isRegistering ? 'Zarejestruj się' : 'Zaloguj się'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                    >
                        {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
                    </button>
                </div>

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 flex items-center">
                        <span className="mr-2">ℹ️</span>
                        Hasło musi mieć minimum 6 znaków
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;