// dev = 개발 환경
// test = 테스트 환경
// prod = 배포 환경
const env = "ENV";

// DB
const dbType = "DB_TYPE";
const dbHost = "DB_HOST";
const dbPort = "DB_PORT";
const dbUserName = "DB_USERNAME";
const dbPassword = "DB_PASSWORD";
const dbDatabase = "DB_DATABASE";

// Hash
const hashRounds = "HASH_ROUNDS";

// JWT
const accessTokenSecret = "ACCESS_TOKEN_SECRET";
const refreshTokenSecret = "REFRESH_TOKEN_SECRET";

// AWS
const awsSecretAccessKey = "AWS_SECRET_ACCESS_KEY";
const awsAccessKeyId = "AWS_ACCESS_KEY_ID";
const awsRegion = "AWS_REGION";
const bucketName = "BUCKET_NAME";
const dbUrl = "DB_URL";

export const envVariablesKeys = {
  env,
  dbType,
  dbHost,
  dbPort,
  dbUserName,
  dbPassword,
  dbDatabase,
  dbUrl,
  hashRounds,
  accessTokenSecret,
  refreshTokenSecret,
  awsSecretAccessKey,
  awsAccessKeyId,
  awsRegion,
  bucketName,
}