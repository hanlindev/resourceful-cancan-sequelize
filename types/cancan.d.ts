declare module 'cancan' {
  namespace Cancan {
    interface ClassConstructor<T> {
      new (...args: Array<any>): T;
    }

    interface InstanceCreator<T> {
      (...args: Array<any>): T;
    }

    interface CancanOptions {
      instanceOf?(
        instance: any, 
        model: ClassConstructor<any>,
      ): boolean;
      createError?(): Error;
    }

    interface ConditionFunction<TPerformer, TTarget> {
      (performer: TPerformer, target: TTarget): boolean;
    }

    type ModelType<TP> = ClassConstructor<TP> | InstanceCreator<TP>;
    type ActionsType = Array<string> | string;
    type TargetsType<TT> = 
      Array<ClassConstructor<any>> | ClassConstructor<TT> | 'all';
    /**
     * Optional callback to apply additional checks on both target and
     * action performers.
     * 
     * If it is an object, the action is only allowed when the target object's
     * attributes have the same value as those specified in this object. The
     * comparison is done by '==='.
     */
    type ConditionType<TP, TT> = Pick<TP, keyof TP> | ConditionFunction<TP, TT>;
  }

  class Cancan {
    constructor(options?: Cancan.CancanOptions);
    allow<TP, TT>(
      model: Cancan.ModelType<TP>,
      actions: Cancan.ActionsType,
      targets: Cancan.TargetsType<TT>,
      condition: Cancan.ConditionType<TP, TT>,
    );
    can(performer: any, action: string, target: any): boolean;
    cannot(performer: any, action: string, target: any): boolean;
    /**
     * Same as .can(), but throws an error instead of returning false.
     */
    authorize(performer: any, action: string, target: any): void;
  }

  export = Cancan;
}