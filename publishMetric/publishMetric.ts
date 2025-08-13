import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
} from "@aws-sdk/client-cloudwatch";

export async function publishMetric(
  totalCases: number,
  passedCases: number,
  failedCases: number,
  pageName: string
): Promise<void> {
  const client = new CloudWatchClient({ region: "us-east-1" });

  const baseDimensions = [{ Name: pageName, Value: pageName }];

  const metrics: MetricDatum[] = [
    {
      MetricName: "TotalTestCases",
      Dimensions: baseDimensions,
      Unit: "Count",
      Value: totalCases,
    },
    {
      MetricName: "PassedTestCases",
      Dimensions: baseDimensions,
      Unit: "Count",
      Value: passedCases,
    },
    {
      MetricName: "FailedTestCases",
      Dimensions: baseDimensions,
      Unit: "Count",
      Value: failedCases,
    },
  ];

  const params = {
    MetricData: metrics,
    Namespace: "playwright-demo",
  };

  const command = new PutMetricDataCommand(params);
  await client.send(command);

  console.log(
    `Published metrics for page '${pageName}' → Total: ${totalCases}, Passed: ${passedCases}, Failed: ${failedCases}`
  );
}
