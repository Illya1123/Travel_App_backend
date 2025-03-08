export const logRoutes = (app) => {
    console.log('Available API routes:');
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { 
            // API gốc không thuộc nested router
            const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
            console.log(`${methods.join(', ')}: ${middleware.route.path}`);
        } else if (middleware.name === 'router') { 
            // API thuộc nested router
            const routePath = middleware.regexp?.source
                .replace('^\\', '') // Loại bỏ ký tự regex ban đầu
                .replace('\\/?(?=\\/|$)', '') // Loại bỏ ký tự kết thúc
                .replace(/\\\//g, '/'); // Chuyển đổi dấu gạch chéo
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
                    console.log(`[${routePath}] ${methods.join(', ')}: ${handler.route.path}`);
                }
            });
        }
    });
};
