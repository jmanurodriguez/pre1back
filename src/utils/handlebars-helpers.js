export const multiply = (a, b) => a * b;

export const calculateTotal = (products) => {
    return products.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
};

export const eq = (a, b) => {
    return a === b;
};

export const range = (start, end) => {

    if (end - start > 10) {
        if (start < 5) {

            return Array.from({ length: 7 }, (_, i) => i + 1).concat(['...', end]);
        } else if (end - start < 5) {

            return [1, '...'].concat(Array.from({ length: 7 }, (_, i) => end - 6 + i));
        } else {

            return [1, '...'].concat(Array.from({ length: 5 }, (_, i) => start - 2 + i)).concat(['...', end]);
        }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export const registerHandlebarsHelpers = (handlebars) => {

    handlebars.handlebars.registerHelper('eq', function(a, b) {
        return a === b;
    });

    handlebars.handlebars.registerHelper('capitalize', function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    });

    handlebars.handlebars.registerHelper('fixImageUrl', function(url) {
        if (!url) return '';

        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        if (url.startsWith('assets.adidas.com') ||
            url.indexOf('.com') > -1 ||
            url.indexOf('.org') > -1 ||
            url.indexOf('.net') > -1) {
            return `https://${url}`;
        }

        return url;
    });

    handlebars.handlebars.registerHelper('generatePaginationLink', function(page) {

        const params = new URLSearchParams();

        params.set('page', page);

        const data = this.hash ? this.hash.data.root : this;

        if (data.appliedFilters) {
            if (data.appliedFilters.category) params.set('category', data.appliedFilters.category);
            if (data.appliedFilters.sort) params.set('sort', data.appliedFilters.sort);
            if (data.appliedFilters.minPrice) params.set('minPrice', data.appliedFilters.minPrice);
            if (data.appliedFilters.maxPrice) params.set('maxPrice', data.appliedFilters.maxPrice);
            if (data.appliedFilters.stock) params.set('stock', 'on');
        }

        return `/products?${params.toString()}`;
    });

    handlebars.handlebars.registerHelper('multiply', function(a, b) {
        return (a * b).toFixed(2);
    });

    handlebars.handlebars.registerHelper('calculateTotal', function(products) {
        if (!products || !products.length) return '0.00';

        const total = products.reduce((sum, item) => {
            const price = item.product?.price || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);

        return total.toFixed(2);
    });

    handlebars.handlebars.registerHelper('formatDate', function(date) {
        if (!date) return '';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('es-ES', options);
    });

    handlebars.handlebars.registerHelper('truncate', function(text, length) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    });
};