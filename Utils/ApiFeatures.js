class ApiFeatures {

    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    filter() {
        let queryString = JSON.stringify(this.queryStr);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        const queryObj = JSON.parse(queryString);

        //************ Mongoose 6.0 or less (or 8.0)**************
        const excludeFields = ['sort', 'page', 'limit', 'fields'];
        excludeFields.forEach((el) => {
            delete queryObj[el];
        });
        /******************************************/

        this.query = this.query.find(queryObj);

        return this;
    }

    sort() {

    }
}

module.exports = ApiFeatures;