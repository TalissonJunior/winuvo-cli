using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using webapi.Models.Attributes;

namespace webapi.Models.Database
{
    [Table("competence")]
    public class Competence
    {
        [PrimaryKey]
		public int id { get; set; }

		[Required(ErrorMessage = "name is required")]
		public string name { get; set; }

		[Required(ErrorMessage = "concept is required")]
		public string concept { get; set; }

		[Required(ErrorMessage = "proficiency_scale is required")]
		public int proficiency_scale { get; set; }

		[CreatedAt]
		public DateTime create_date { get; set; }

		[UpdatedAt]
		public DateTime update_date { get; set; }

    }
}