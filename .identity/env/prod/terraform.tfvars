prefix    = "io"
env       = "prod"
env_short = "p"
domain    = "io-web"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "io"
  Source      = "https://github.com/pagopa/io-web-profile-backend"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

ci_github_federations = [
  {
    repository = "io-web-profile-backend"
    subject    = "prod-ci"
  }
]

cd_github_federations = [
  {
    repository = "io-web-profile-backend"
    subject    = "prod-cd"
  }
]

environment_ci_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "terraform-state-rg" = [
      "Storage Blob Data Reader"
    ],
    "dashboards" = [
      "Reader"
    ]
  }
}

environment_cd_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "terraform-state-rg" = [
      "Storage Blob Data Contributor"
    ],
    "dashboards" = [
      "Contributor"
    ]
  }
}
