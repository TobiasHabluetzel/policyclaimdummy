namespace SystemsDemo.Api.GraphQL;

/// <summary>
/// GraphQL surface our claims app calls. Placeholder fields land in the next
/// commit (search / policy lookup operations).
/// </summary>
public class Query
{
    public string Hello() => "policyclaimdummy GraphQL is up";
}
