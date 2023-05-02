import { useMemo } from "react";
import { PrimitiveAtom, useAtom } from "jotai";

type Options<T extends Array<unknown>> = {
    loader: () => Promise<T> | T,
    onError?(err: unknown): void,
    onSuccess?(data: T): void,
}

/**
 * Hook to create lazy data list with jotai.
 * Into options you can pass a loader function that will be called when the list is empty.
 * You can also pass optional callbacks for success and error.
 * @param listAtom - Jotai atom to store the list (e.g. Atom<[]>)
 * @param options - Options object - loader, onSuccess, onError
 */

export const useLazyDataList = <T extends Array<unknown>>(listAtom: PrimitiveAtom<T>, options: Options<T>) => {
    const [ list, setList ] = useAtom(listAtom)
    const proxy = useMemo(() => new Proxy({ data: list }, {
        get: (target, key, receiver) => {
            if (target.data.length === 0) {
                load()
            }

            return Reflect.get(target, key, receiver);
        },
    }), [])

    const load = async () => {
        try {
            const data = await options.loader()
            
            setList(data)
            proxy.data = data as Awaited<T>
            options.onSuccess?.(data) 
        } catch(err) {
            if (options.onError) {
                return options.onError(err)
            }

            console.error(err)
        }
    }

    const onChange = (newValue: T) => {
        setList(newValue)
        proxy.data = newValue as Awaited<T>
    }

    return [
        proxy,
        onChange
    ] as const
}
