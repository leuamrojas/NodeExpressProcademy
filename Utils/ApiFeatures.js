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
        //SORTING LOGIC (use - before the field to sort in descending order)
        if(this.queryStr.sort) {            
            const sortBy = this.queryStr.sort.split(",").join(" "); //sort filters must be separated by space
            // const s = { releaseYear: 1 };
            this.query = this.query.sort(sortBy);            
        }
        else {
            this.query = this.query.sort('createdAt'); //default sort order
        }

        return this;
    }

    limit() {
        //LIMITING FIELDS (to exclude fields use -before the field in the query string (e.g. -duration))
        if(this.queryStr.fields){
            const fields = this.queryStr.fields.split(",").join(" ");
            this.query = this.query.select(fields); //you could also use field property 'select: false' in the schema to hide it
        } else {
            this.query = this.query.select('-__v'); //if no field is specified, it will remove '__v' by default
        }

        return this;
    }

    paginate() {
        //PAGINATION
        const page = +this.queryStr.page || 1;
        const limit = +this.queryStr.limit || 10;
        //PAGE 1: 1-10; PAGE 2: 11-20; PAGE 3: 21-30
        const skip = (page-1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        // if(this.queryStr.page) {
        //     const moviesCount = await Movie.countDocuments();
        //     if(skip >= moviesCount){
        //         throw new Error("This page is not found!");
        //     }
        // }

        return this;
    }
}

module.exports = ApiFeatures;