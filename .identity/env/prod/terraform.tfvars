prefix    = "io"
env       = "prod"
env_short = "p"
domain    = "web-profile-backend"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "io"
  Source      = "https://github.com/pagopa/io-web-profile-backend"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

opex_environment_ci_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "terraform-state-rg" = [
      "Reader and Data Access"
    ],
    "dashboards" = [
      "Reader"
    ]
  }
}

opex_environment_cd_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "terraform-state-rg" = [
      "Storage Blob Data Contributor",
      "Reader and Data Access"
    ],
    "dashboards" = [
      "Contributor"
    ]
  }
}
