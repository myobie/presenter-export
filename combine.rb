#!/usr/bin/env ruby

require "combine_pdf"
require "json"
require "pathname"

pdf = CombinePDF.new

json_path = Pathname.new(ARGV.first).realpath
base_dir = json_path.dirname
output_path = base_dir.join("combined.pdf")

json = JSON.parse(File.read(json_path))

json.sort! { |a, b| a["number"] <=> b["number"] }

json.each do |slide|
  path = base_dir.join(".#{slide["path"]}")
  pdf << CombinePDF.load(path)
end

pdf.save output_path
