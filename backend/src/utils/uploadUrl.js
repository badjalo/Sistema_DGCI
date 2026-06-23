const normalizeUploadUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    let normalized = url.replace(/^\/public\/uploads\//, '/uploads/');
    
    // Se API_URL estiver definido, prefixamos o caminho para que o frontend encontre no backend
    const apiUrl = process.env.API_URL || '';
    if (apiUrl) {
        normalized = `${apiUrl.replace(/\/$/, '')}/${normalized.replace(/^\//, '')}`;
    }
    
    // Adicionar cache-buster para forçar recarregamento de imagens atualizadas
    if (normalized && !normalized.includes('?v=')) {
        normalized += `?v=${Date.now()}`;
    }
    return normalized;
};

const normalizeMemberData = (member) => {
    if (!member || typeof member !== 'object') return member;
    if ('foto_url' in member) member.foto_url = normalizeUploadUrl(member.foto_url);
    if ('assinatura_url' in member) member.assinatura_url = normalizeUploadUrl(member.assinatura_url);
    if ('membro_foto' in member) member.membro_foto = normalizeUploadUrl(member.membro_foto);
    if ('avatar_url' in member) member.avatar_url = normalizeUploadUrl(member.avatar_url);
    return member;
};

const normalizeMembersList = (rows) => {
    if (!Array.isArray(rows)) return rows;
    return rows.map(normalizeMemberData);
};

module.exports = { normalizeUploadUrl, normalizeMemberData, normalizeMembersList };