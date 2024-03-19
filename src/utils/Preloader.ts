import {
    AbstractMesh,
    IParticleSystem,
    Observable,
    Skeleton,
    type Scene,
    SceneLoader,
} from "@babylonjs/core";

export interface Asset {
    meshes: AbstractMesh[];
    particleSystems: IParticleSystem[];
    skeletons: Skeleton[];
}

/**
 * File to load.
 */
export interface PreloaderFile {
    /** Unique ID. */
    key: string;
    /** The mesh name to load. */
    name: string;
    /** The .babylon filename. */
    path: string;
}

interface PreloaderEventMap {
    "finished": Event;
    "error": CustomEvent<{ message: string }>;
}

export interface Preloader extends EventTarget {
    addEventListener<K extends keyof PreloaderEventMap>(
        type: K,
        listener: (this: Preloader, ev: PreloaderEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof PreloaderEventMap>(
        type: K, listener: (this: Preloader, ev: PreloaderEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
    ): void;
}

export class Preloader extends EventTarget {
    /** The root model containing all to-be-loaded models. */
    rootFolder: string;
    /** The scene that will contain the loaded models. */
    scene: Scene;
    /** The loaded (rounded) percentage of the loader. */
    progress: number = 0;

    onSuccessObservable: Observable<void> = new Observable();

    /** The list of files to load. */
    private _filesToLoad: PreloaderFile[] = [];
    /** The number of files completely loaded. */
    private _fileLoadedSuccess: number = 0;
    private _fileLoadedError: number = 0;
    private _loading: boolean = false;
    private _assets: Record<string, Asset> = {};
    private _el: HTMLElement;

    get finished() {
        return this._fileLoadedError + this._fileLoadedSuccess === this._filesToLoad.length;
    }

    /** All available assets. */
    get assets() {
        return this._assets;
    }

    /** Indicates if the loader has been started. */
    get loading() {
        return this._loading;
    }

    constructor(rootFolder: string, scene: Scene) {
        super();
        this.rootFolder = rootFolder;
        this.scene = scene;

        const el = document.getElementById("loadingValue") as HTMLElement;
        if (!el) {
            throw new Error("loadingValue element is missing");
        }
        this._el = el;
    }

    /**
     * Add a model to the list of model to load.
     * This function should be called before starting the loader
     * @param key Unique ID.
     * @param name Model name.
     * @param path Model path.
     */
    add(key: string, name: string, path: string) {
        this._filesToLoad.push({ key: key, name: name, path: path });
    }

    /**
     * Start the loader. All models previously added will be loaded.
     */
    start() {
        this._loading = true;
        this._fileLoadedSuccess = 0;

        if (this._filesToLoad.length == 0) {
            this._loading = false;
            this.dispatchEvent(new Event("finished"));
            this.onSuccessObservable.notifyObservers();
        } else {
            for (let i=0; i<this._filesToLoad.length; i++) {
                this.loadFile(this._filesToLoad[i]);
            }
        }
    }

    protected loadFile(file: PreloaderFile) {
        SceneLoader.ImportMesh(
            file.name,
            this.rootFolder,
            file.path,
            this.scene,
            (newMeshes, particleSystems, skeletons) => {
                this._onSuccess(file.key, newMeshes, particleSystems, skeletons);
            },
            null,
            () => {
                this._onError(file.name, file.path)
            }
        );
    }

    protected _register(
        key: string,
        newMeshes: AbstractMesh[],
        particleSystems: IParticleSystem[],
        skeletons: Skeleton[]
    ) {
        const asset: Asset = {
            meshes: newMeshes,
            particleSystems: particleSystems,
            skeletons: skeletons,
        };
        this._assets[key] = asset;
    }

    private _update() {
        this.progress = (this._fileLoadedSuccess + this._fileLoadedError) / (this._filesToLoad.length) * 100;
        this._el.innerHTML = `${this.progress}%`;
    }

    /**
     * Function called when a model is successfully loaded.
     * All loaded models are set invisibles, and the number of loaded file is incremented.
     */
    private _onSuccess(
        key: string,
        newMeshes: AbstractMesh[],
        particlesSystem: IParticleSystem[],
        skeletons: Skeleton[]
    ) {
        // Increment the number of file loaded successfully
        this._fileLoadedSuccess++;
        // Update progress and loading text
        this._update();
        // Set all meshes invisible
        newMeshes.forEach((m) => {
            m.isVisible = false;
        });
        // Save the link key -> data model
        this._register(key, newMeshes, particlesSystem, skeletons);
        // If loading finish, notify the game
        if (this.finished) {
            this._loading = false;
            this.dispatchEvent(new Event("finished"));
            this.onSuccessObservable.notifyObservers();
        }
    }

    private _onError(name: string, path: string) {
        this._fileLoadedError++;
        const event = new CustomEvent("error", {
            detail: {
                message: `Impossible to load the mesh ${name} from the file ${path}`
            }
        });
        this.dispatchEvent(event);
    }
}
