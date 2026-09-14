function tenantMiddleware(req, res, next) {
    const tenantId = req.headers['x-tenant-id'] || 'default';
    req.tenantId = tenantId;
    next();
}

module.exports = tenantMiddleware;
