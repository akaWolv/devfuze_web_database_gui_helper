//var ForerunnerDB = require("forerunnerdb");
//var fdb = new ForerunnerDB();
//
///**
// * ForrunnerDB adapter
// * @link http://www.forerunnerdb.com/
// */
//class ForerunnerAdapter{
//
//    /**
//     * @param databaseName
//     * @param databaseCollection
//     * @param persistenceDataDir
//     */
//    constructor(
//        databaseName,
//        databaseCollection
//    ) {
//        console.log([databaseName, databaseCollection]);
//        [databaseName, databaseCollection].indexOf(undefined) == -1 || console.error('Pls provide all required params to ForerunnerAdapter');
//
//        this.databaseName = databaseName;
//        this.databaseCollection = databaseCollection;
//
//        this.db = undefined;
//        this.collection = undefined;
//
//        this._connect();
//    }
//
//    /**
//     * Connect to db / colleciton
//     * @private
//     */
//    _connect() {
//        this.db = fdb.db(this.databaseName);
//        this.collection = db.collection(this.databaseCollection);
//    }
//
//    getDb() {
//        return this.collection;
//    }
//}
//
//export default ForerunnerAdapter;