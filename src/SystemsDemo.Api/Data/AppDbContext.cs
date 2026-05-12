using Microsoft.EntityFrameworkCore;

namespace SystemsDemo.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Entities land in the next commit (Policy, Claim, etc.).
}
