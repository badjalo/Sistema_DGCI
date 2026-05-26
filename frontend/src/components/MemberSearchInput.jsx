import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import api from '../services/api';

const MemberSearchInput = ({ value, onChange, placeholder = "Pesquisar membro..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const searchMembers = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/membros', {
                    params: { search: searchTerm, limit: 10 }
                });
                setResults(data.data || []);
                setIsOpen(true);
            } catch (error) {
                console.error('Erro ao pesquisar membros:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(searchMembers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (member) => {
        setSelected(member);
        setSearchTerm('');
        setResults([]);
        setIsOpen(false);
        onChange(member.id, member);
    };

    const handleClear = () => {
        setSelected(null);
        setSearchTerm('');
        setResults([]);
        onChange('', null);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                {selected ? (
                    <input
                        type="text"
                        disabled
                        value={`${selected.nome_completo} (${selected.numero_membro})`}
                        className="form-control pl-11 pr-10 bg-gray-50 text-gray-900 font-medium"
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => searchTerm && setIsOpen(true)}
                        className="form-control pl-11 pr-10"
                        autoComplete="off"
                    />
                )}
                {selected && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {isOpen && (results.length > 0 || isLoading) && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-3 text-center text-gray-500 text-sm">A pesquisar...</div>
                    ) : results.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">Nenhum membro encontrado</div>
                    ) : (
                        results.map((member) => (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => handleSelect(member)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                            >
                                <div className="font-semibold text-gray-900">{member.nome_completo}</div>
                                <div className="text-sm text-gray-500">{member.numero_membro} • {member.estado}</div>
                            </button>
                        ))
                    )}
                </div>
            )}


        </div>
    );
};

export default MemberSearchInput;
