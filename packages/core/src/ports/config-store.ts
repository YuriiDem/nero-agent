export type ConfigStore<T> = {
  read(): Promise<T | undefined>;
  write(config: T): Promise<void>;
};
