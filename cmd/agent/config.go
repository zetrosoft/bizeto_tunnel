package main

import (
	"encoding/json"
	"os"
)

type Config struct {
	APIKey    string `json:"api_key"`
	LocalPort int    `json:"local_port"`
	RelayAddr string `json:"relay_addr"`
	GRPCAddr  string `json:"grpc_addr"`
}

func LoadConfig(path string) (*Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var cfg Config
	if err := json.NewDecoder(file).Decode(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
