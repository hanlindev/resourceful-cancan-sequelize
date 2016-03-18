declare namespace __cancan {
    /**
     * Check if instance is an instance of model.
     * @param  {any}     instance any object
     * @param  {any}     model    constructor
     * @return {boolean}
     */
    function instanceOf(instance: any, model: any): boolean;

    interface ConfigFunction<TUser> {
        (instance: TUser): void;
    }
    interface ConstructorFunction<TUser> {
        new (...args: any[]): TUser;
    }
    interface AbilitySpecs<TUser> {
        entity: ConstructorFunction<TUser>;
        config: ConfigFunction<TUser>;
    }
    /**
     * Add a new configuration for a class/entity
     * @param  {Function} entity  entity class/function
     * @param  {Function} config  function that defines rules
     */
    function configure<TUser>(
        entity: ConstructorFunction<TUser>,
        config: ConfigFunction<TUser>
    );

    /**
     * Clear all existing configuration
     */
    function clear();

    /**
     * Test if an entity instance can execute
     * specific action on a sepcific target
     * @param  {Object} model   class/entity instance
     * @param  {String} action  action name
     * @param  {Object} target  target instance
     * @return {Boolean}
     */
    function can(model: any, action: string, target: any): boolean;

    /**
     * Return negated result of #can()
     * @return {Boolean}
     */
    function cannot(model: any, action: string, target: any): boolean;

    /**
     * Same as #can(), but throws an exception
     * if access is not granted
     */
    function authorize(model: any, action: string, target: any);

    /**
     * Ability definition
     */
    class Ability<TUser> {
        public rules: any[];

        /**
         * Ability#addRule alias
         */
        public can<TModel>(
            actions: string[]|string,
            targets: ConstructorFunction<TModel>[]|ConstructorFunction<TModel>,
            attrs: (model: TModel) => boolean|any
        );

        /**
         * Add a new rule
         *
         * @param {Array|String} actions    name or array of names
         * @param {Array|Function} targets  function or array of functions (classes)
         * @param {Function|Object} attrs   validator function or object of properties
         */
        public addRule<TModel>(
            actions: string[]|string,
            targets: ConstructorFunction<TModel>[]|ConstructorFunction<TModel>,
            attrs: (model: TModel) => boolean|any
        );

        /**
         * Test if access should be granted
         *
         * @param  {String} action  action name
         * @param  {Object} target  target object
         * @return {Boolean}
         */
        public test(action: string, target: any): boolean;
    }

    /**
     * Test if action requirements are satisfied
     *
     * @param  {String} action  action name
     * @param  {Object} rule    rule object
     * @return {Boolean}
     */
    function actionMatches(action: string, rule: any): boolean;

    /**
     * Test if target requirements are satisfied
     *
     * @param  {Object} target  target object
     * @param  {Object} rule    rule object
     * @return {Boolean}
     */
    function targetMatches(target: any, rule: any): boolean;

    /**
     * Test if attributes match
     *
     * @param  {Object} target - target object
     * @param  {Object} rule   - rule object
     * @return {Boolean}
     */
    function attrsMatch (target: any, rule: any): boolean;

    /**
     * Get a property of an object
     * and use .get() method, if there is one
     * to support various ORM/ODMs
     *
     * @param  {Object} model    - target object
     * @param  {String} property - wanted property
     * @return {Mixed}
     */
    function get (model: any, property: string): any;

    /**
     * Determine whether `obj` has all `props` and
     * their exact values
     *
     * @param  {Object} obj   - target object
     * @param  {Object} props - set of required properties
     * @return {Boolean}
     */
    function matches (obj: any, props: any): boolean;
}

declare module 'cancan' {
    export = __cancan;
}
